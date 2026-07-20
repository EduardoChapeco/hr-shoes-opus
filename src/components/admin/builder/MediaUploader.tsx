import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { getBrowserClient } from "@/lib/supabase";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";

interface MediaUploaderProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  bucket?: string;
}

export function MediaUploader({ value, onChange, label, bucket = "product-media" }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      setCurrentImageFile(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setCurrentImageSrc(reader.result as string);
        setCropModalOpen(true);
      };
      reader.onerror = () => toast.error("Erro ao processar imagem local");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Video upload fallback (no crop)
    handleUploadMediaDirectly(file);
  };

  const handleUploadMediaDirectly = async (file: File) => {
    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const base64 = event.target.result as string;
            const { uploadMedia } = await import("@/services/storage.functions");
            const res = await uploadMedia({
              data: { fileName: file.name, fileBase64: base64, bucket: bucket as any }
            });

            if (res.status === "success") {
              onChange(res.url);
              toast.success("Mídia carregada com sucesso");
            } else {
              toast.error(res.message);
            }
          } catch (err: any) {
            toast.error(err.message || "Erro no upload");
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar upload");
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedBase64: string) => {
    if (!currentImageFile) return;
    setIsUploading(true);
    try {
      const { uploadMedia } = await import("@/services/storage.functions");
      const res = await uploadMedia({
        data: { fileName: currentImageFile.name, fileBase64: croppedBase64.split(",")[1], bucket: bucket as any }
      });
      if (res.status === "success") {
        onChange(res.url);
        toast.success("Imagem enviada com sucesso");
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const isVideo = value ? !!value.split('?')[0].match(/\.(mp4|webm|mov|ogg)$/i) : false;

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-xs font-medium">{label}</label>}
      
      {value ? (
        <div className="relative rounded-md overflow-hidden border group bg-muted flex items-center justify-center">
          {isVideo ? (
            <video src={value} className="w-full h-32 object-cover" muted />
          ) : (
            <img src={value} alt="Media preview" className="w-full h-32 object-cover" />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button 
              variant="destructive" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={() => onChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className="h-32 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
          <span className="text-xs font-medium">{isUploading ? "Enviando..." : "Fazer Upload"}</span>
        </div>
      )}
      
      <div className="flex gap-2">
        <Input
          className="h-8 text-xs bg-background flex-1"
          placeholder="Ou cole uma URL (https://...)"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      
      <input
        type="file"
        accept="image/*,video/mp4,video/webm"
        className="hidden"
        ref={fileInputRef}
        onChange={handleUpload}
      />
      <ImageCropperDialog
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageSrc={currentImageSrc}
        onCropCompleteAction={handleCropComplete}
      />
    </div>
  );
}

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadMedia } from "@/services/storage.functions";
import { cn } from "@/lib/utils";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onRemove?: () => void;
  bucket?: "product-media" | "cms-media";
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  bucket = "cms-media",
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentImageFile(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCurrentImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.onerror = () => toast.error("Erro ao processar arquivo local");

    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCropComplete = async (croppedBase64: string) => {
    if (!currentImageFile) return;
    setIsUploading(true);
    try {
      const { getSignedUploadUrl } = await import("@/services/storage.functions");
      const res = await getSignedUploadUrl({
        data: {
          fileName: currentImageFile.name,
          bucket,
          contentType: currentImageFile.type,
        },
      });

      if (!res.signedUrl) {
        throw new Error("Erro ao obter URL de upload");
      }

      // Convert base64 to Blob for PUT request
      const base64Data = croppedBase64.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const mimeType = croppedBase64.startsWith("data:image/png") ? "image/png" : "image/webp";
      const blob = new Blob(byteArrays, { type: mimeType });

      // Upload directly to Supabase Storage via Signed URL
      const uploadRes = await fetch(res.signedUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${res.token}`,
          "Content-Type": mimeType,
        },
        body: blob,
      });

      if (!uploadRes.ok) {
        throw new Error("Falha no upload direto para o storage");
      }

      onChange(res.publicUrl!);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {value ? (
        <div className="relative min-h-[100px] max-h-[200px] w-full max-w-sm overflow-hidden rounded-lg border border-border p-3 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <img src={value} alt="Upload" className="max-h-36 w-auto max-w-full object-contain" />
          {onRemove && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full"
              onClick={onRemove}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex aspect-video w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/50 p-6 hover:bg-muted">
          <div className="rounded-full bg-background p-3 shadow-sm">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Clique para enviar imagem</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP ou GIF (max. 5MB)</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Selecionar arquivo"}
          </Button>
        </div>
      )}
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
        onChange={handleFileChange}
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

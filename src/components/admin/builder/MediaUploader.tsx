import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { getBrowserClient } from "@/lib/supabase";

interface MediaUploaderProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  bucket?: string;
}

export function MediaUploader({ value, onChange, label, bucket = "public" }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const supabase = getBrowserClient();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `builder/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Mídia carregada com sucesso");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-xs font-medium">{label}</label>}
      
      {value ? (
        <div className="relative rounded-md overflow-hidden border group bg-muted flex items-center justify-center">
          {value.match(/\.(mp4|webm)$/i) ? (
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
    </div>
  );
}

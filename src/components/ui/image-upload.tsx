import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadMedia } from "@/services/storage.functions";
import { cn } from "@/lib/utils";

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadMedia(file, bucket);
      onChange(url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {value ? (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
          <img src={value} alt="Upload" className="h-full w-full object-cover" />
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
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Selecionar arquivo"
            )}
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
    </div>
  );
}

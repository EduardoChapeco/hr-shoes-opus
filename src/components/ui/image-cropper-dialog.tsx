import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import getCroppedImg from "@/lib/crop-image";
import { Loader2, Info, Crop, Maximize2, Square, Layout } from "lucide-react";

interface ImageCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  aspect?: number;
  onCropCompleteAction: (croppedBase64: string) => void;
}

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  aspect: initialAspect,
  onCropCompleteAction,
}: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(initialAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      // Output as PNG to preserve PNG alpha channel transparency!
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 0, { horizontal: false, vertical: false }, "image/png");
      onCropCompleteAction(croppedImage);
      onOpenChange(false);
    } catch (e) {
      console.error("Erro ao recortar imagem:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="size-5 text-primary" /> Recortar e Ajustar Imagem
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Ajuste a área de corte e o formato da imagem. Imagens transparentes (PNG) manterão o fundo transparente sem fundo preto.
          </p>
        </DialogHeader>

        {imageSrc ? (
          <div className="space-y-4 pt-2">
            {/* Checkerboard pattern background for transparency preview */}
            <div className="relative w-full h-[360px] rounded-lg overflow-hidden border border-border bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] bg-slate-100 dark:bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={selectedAspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                style={{
                  containerStyle: { background: "transparent" },
                  cropAreaStyle: { border: "2px solid #FF4FB8", boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" },
                }}
              />
            </div>

            {/* Aspect ratio controls */}
            <div className="flex items-center gap-2 flex-wrap justify-between border-t pt-3">
              <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                Proporção de Corte:
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  type="button"
                  variant={selectedAspect === undefined ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setSelectedAspect(undefined)}
                >
                  <Maximize2 className="size-3.5" /> Livre / Original
                </Button>
                <Button
                  type="button"
                  variant={selectedAspect === 4 / 1 ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setSelectedAspect(4 / 1)}
                >
                  <Layout className="size-3.5" /> Logo Retangular (4:1)
                </Button>
                <Button
                  type="button"
                  variant={selectedAspect === 1 ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setSelectedAspect(1)}
                >
                  <Square className="size-3.5" /> Quadrado (1:1)
                </Button>
                <Button
                  type="button"
                  variant={selectedAspect === 16 / 9 ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setSelectedAspect(16 / 9)}
                >
                  Banner (16:9)
                </Button>
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(vals) => setZoom(vals[0])}
              />
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Nenhuma imagem selecionada.
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !imageSrc}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Processando...
              </>
            ) : (
              "Confirmar Corte & Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

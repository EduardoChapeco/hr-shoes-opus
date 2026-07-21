import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import getCroppedImg from "@/lib/crop-image";
import { Loader2, Info } from "lucide-react";

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
  aspect,
  onCropCompleteAction,
}: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropCompleteAction(croppedImage);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Recortar e Ajustar Imagem</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Ajuste o zoom usando a barra abaixo ou fazendo o gesto de pinça (pinch-to-zoom).
          </p>
        </DialogHeader>

        {imageSrc ? (
          <div className="space-y-4 pt-2">
            <div className="relative w-full h-[400px] bg-black/10 rounded-md overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="bg-muted/50 p-3 rounded-md flex items-start gap-3 border border-border">
              <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Medida Universal Recomendada</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {aspect === 21/9 ? "Para banners full-width, use imagens de pelo menos 1920x800 pixels para evitar perda de qualidade em telas grandes." 
                  : aspect === 4/5 ? "Para produtos ou retratos, use 1080x1350 pixels (padrão de redes sociais)."
                  : aspect === 1 ? "Para grade quadrada, use 1080x1080 pixels."
                  : "Utilize imagens de alta resolução que correspondam ao formato de exibição desejado para não estourar a caixa."}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-medium">Zoom</p>
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
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhuma imagem carregada</p>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!imageSrc || isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar e Recortar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

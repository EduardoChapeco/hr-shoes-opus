import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { createReview } from "@/services/cms.functions";

export function ReviewModal({ productId, productName }: { productId: string, productName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota.");
      return;
    }
    setLoading(true);
    try {
      const res = await createReview({ data: { productId, rating, comment } });
      toast.success("Avaliação enviada com sucesso!");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2 text-xs h-7">Avaliar Produto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar {productName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2 justify-center">
            {[1,2,3,4,5].map(star => (
              <Star
                key={star}
                className={`w-8 h-8 cursor-pointer ${star <= rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          <Textarea 
            placeholder="O que você achou do produto? (Opcional)" 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

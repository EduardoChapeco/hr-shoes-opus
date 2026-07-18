import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, ClipboardCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Importa a função de auditoria.
import { performStockAudit } from "@/services/stock.functions";

export function StockAuditDialog({ variant }: { variant: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [countedQty, setCountedQty] = useState(variant.stock_on_hand.toString());
  const [reason, setReason] = useState<"recount" | "loss" | "damage" | "return_defect">("recount");
  const [notes, setNotes] = useState("");

  const handleAudit = async () => {
    const qty = parseInt(countedQty, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error("A quantidade contada deve ser um número válido (zero ou maior).");
      return;
    }

    if (qty === variant.stock_on_hand) {
      toast.info("A contagem é igual ao sistema. Nenhum ajuste necessário.");
      setOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await performStockAudit({
        data: {
          variantId: variant.id,
          countedQty: qty,
          reason,
          notes,
        },
      });

      if (res.status === "success") {
        toast.success(res.data.message);
        setOpen(false);
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao realizar auditoria.");
      }
    } catch (e) {
      toast.error("Falha inesperada ao conectar com o banco de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ClipboardCheck className="mr-1.5 size-4" /> Balanço
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Auditoria de Balanço (SKU: {variant.sku})</DialogTitle>
          <DialogDescription>
            Corrija o estoque físico. A diferença será registrada de forma imutável no log de auditoria.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <Label>Sistema Acusa</Label>
              <Input disabled value={variant.stock_on_hand} className="bg-muted" />
            </div>
            <div className="flex-1 space-y-1">
              <Label>Contado na Prateleira</Label>
              <Input 
                type="number" 
                min="0" 
                value={countedQty} 
                onChange={(e) => setCountedQty(e.target.value)} 
                className="font-semibold text-blue-600"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <Label>Motivo do Ajuste</Label>
            <Select value={reason} onValueChange={(val: any) => setReason(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recount">Recontagem Simples (Ajuste)</SelectItem>
                <SelectItem value="loss">Perda de Estoque / Sumiço</SelectItem>
                <SelectItem value="damage">Quebra / Avaria Logística</SelectItem>
                <SelectItem value="return_defect">Devolução com Defeito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Observações (Opcional)</Label>
            <Textarea 
              placeholder="Ex: Tênis esquerdo sumiu, ajustado no inventário..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleAudit} disabled={isSubmitting || parseInt(countedQty, 10) === variant.stock_on_hand}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Registrar Balanço
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

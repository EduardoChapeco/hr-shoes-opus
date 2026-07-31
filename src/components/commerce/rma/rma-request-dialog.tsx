import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { requestRma } from "@/services/rma.functions";
import { useRouter } from "@tanstack/react-router";
import { Upload } from "lucide-react";

export function RmaRequestDialog({ orderId, orderItems }: { orderId: string; orderItems: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState("");
  const [resolutionType, setResolutionType] = useState("store_credit");
  const [rmaType, setRmaType] = useState("return"); // return, exchange, warranty

  const handleSubmit = async () => {
    const variantsToReturn = orderItems.filter((i) => selectedItems[i.variant_id]);
    if (variantsToReturn.length === 0) {
      toast.error("Selecione ao menos um item para devolver.");
      return;
    }
    if (reason.length < 10) {
      toast.error("Por favor, descreva o motivo com mais detalhes (mínimo 10 caracteres).");
      return;
    }

    setLoading(true);
    try {
      const itemsPayload = variantsToReturn.map((item) => ({
        variantId: item.variant_id,
        quantity: item.qty,
        reason: reason,
        condition: "new",
      }));

      await requestRma({
        data: {
          orderId,
          type: rmaType,
          resolutionType,
          items: itemsPayload,
        },
      });

      toast.success("Solicitação de Devolução aberta com sucesso!");
      setOpen(false);
      useRouter().invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao abrir solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full mt-4 text-destructive border-destructive hover:bg-destructive/10"
        >
          Solicitar Troca / Devolução
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Troca & Devolução Fácil</DialogTitle>
          <DialogDescription>
            Selecione os itens do pedido que você deseja devolver e a forma de ressarcimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-foreground">1. Quais itens deseja devolver?</h4>
            <div className="space-y-2">
              {orderItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={!!selectedItems[item.variant_id]}
                    onChange={(e) =>
                      setSelectedItems((prev) => ({
                        ...prev,
                        [item.variant_id]: e.target.checked,
                      }))
                    }
                  />
                  <div>
                    <p className="font-medium text-sm text-foreground">{item.product_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Qtd: {item.qty}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-foreground">2. Qual o tipo de solicitação?</h4>
            <Select value={rmaType} onValueChange={setRmaType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="return">Devolução por Arrependimento</SelectItem>
                <SelectItem value="exchange">Troca (Cor / Tamanho)</SelectItem>
                <SelectItem value="warranty">Produto com Defeito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-foreground">3. Como prefere o ressarcimento?</h4>
            <Select value={resolutionType} onValueChange={setResolutionType}>
              <SelectTrigger>
                <SelectValue placeholder="Forma de devolução" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="store_credit">Vale-Compras (Imediato)</SelectItem>
                <SelectItem value="gateway_refund">Estorno no Cartão / PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-foreground">4. Descreva o motivo</h4>
            <Textarea
              placeholder="Ex: O tamanho ficou pequeno, gostaria de trocar por um maior."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {rmaType === "warranty" && (
            <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center space-y-2">
              <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Envie fotos destacando o defeito.</p>
              <Button size="sm" variant="secondary" className="w-full">
                Anexar Fotos
              </Button>
            </div>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Processando..." : "Confirmar Solicitação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

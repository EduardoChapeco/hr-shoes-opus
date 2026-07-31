import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { addFinancialRecord } from "@/services/hr.functions";

export function EmployeeAdvanceDialog({ employeeId, onSuccess }: { employeeId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("advance_payment");
  const [amountStr, setAmountStr] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!employeeId) {
      toast.error("Selecione um funcionário antes de lançar valores.");
      return;
    }

    const val = parseFloat(amountStr.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Digite um valor válido.");
      return;
    }

    const amountCents = Math.round(val * 100);
    // Vales/Deduções são negativos no saldo da folha, Comissões/Salários são positivos
    const finalCents = (type === "advance_payment" || type === "deduction") ? -amountCents : amountCents;

    setLoading(true);
    try {
      await addFinancialRecord({
        data: {
          employeeId,
          type,
          amountCents: finalCents,
          description
        }
      });
      toast.success("Lançamento registrado com sucesso!");
      setOpen(false);
      setAmountStr("");
      setDescription("");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!employeeId}>Lançar Valor</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Lançamento Financeiro</DialogTitle>
          <DialogDescription>
            Lance comissões, vales ou deduções na folha de pagamento deste mês.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo de Lançamento</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advance_payment">Vale / Adiantamento (Débito)</SelectItem>
                <SelectItem value="commission">Comissão Avulsa (Crédito)</SelectItem>
                <SelectItem value="salary_base">Salário Base (Crédito)</SelectItem>
                <SelectItem value="deduction">Estorno / Dedução (Débito)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Valor (R$)</label>
            <input 
              type="number"
              step="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descrição (Opcional)</label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Vale referente a farmácia"
              rows={2}
              className="resize-none"
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={loading || !amountStr}>
            {loading ? "Registrando..." : "Confirmar Lançamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

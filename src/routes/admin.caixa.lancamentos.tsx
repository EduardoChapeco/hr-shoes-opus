import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Wallet } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { getActiveRegister, addRegisterEntry } from "@/services/cash.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/caixa/lancamentos")({
  head: () => ({ meta: [{ title: "Lançamentos do Caixa — Hr Shoes" }] }),
  loader: async () => {
    return await getActiveRegister();
  },
  component: CaixaLancamentosPage,
});

function CaixaLancamentosPage() {
  const register = Route.useLoaderData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    amountCents: "",
    method: "cash" as "cash" | "credit" | "debit" | "pix" | "other",
    description: "",
    type: "in" as "in" | "out",
  });

  if (!register) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Lançamentos do Caixa"
          description="Registre entradas e saídas manuais no caixa ativo."
        />
        <EmptyState
          title="Nenhum caixa aberto"
          description="Abra um caixa na página de Caixa antes de registrar lançamentos."
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(form.amountCents.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Valor inválido");
      return;
    }
    const cents = Math.round(parsed * 100);
    setIsSaving(true);
    try {
      await addRegisterEntry({
        data: {
          registerId: register.id,
          amountCents: form.type === "out" ? -cents : cents,
          method: form.method,
          description: form.description,
        },
      });
      toast.success("Lançamento registrado!");
      setOpen(false);
      setForm({ amountCents: "", method: "cash", description: "", type: "in" });
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao registrar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Lançamentos do Caixa"
          description={`Caixa aberto em ${new Date(register.opened_at).toLocaleDateString("pt-BR")} — Saldo atual: ${formatMoney(register.currentBalanceCents)}`}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Lançamento Manual</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry-type">Tipo</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v as "in" | "out" }))}
                  >
                    <SelectTrigger id="entry-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Entrada</SelectItem>
                      <SelectItem value="out">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry-method">Forma de Pagamento</Label>
                  <Select
                    value={form.method}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, method: v as typeof form.method }))
                    }
                  >
                    <SelectTrigger id="entry-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-amount">Valor (R$)</Label>
                <Input
                  id="entry-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  value={form.amountCents}
                  onChange={(e) => setForm((f) => ({ ...f, amountCents: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-desc">Descrição</Label>
                <Input
                  id="entry-desc"
                  placeholder="Ex: Pagamento fornecedor, retirada de troco..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                  minLength={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Saldo Inicial</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatMoney(register.initial_balance_cents)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Saldo Atual</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {formatMoney(register.currentBalanceCents)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <Wallet className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="secondary" className="mt-1">
              Aberto
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Ticket, Plus, Trash2, Tag, Percent, DollarSign, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { listCoupons, upsertCoupon, deleteCoupon } from "@/services/growth.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/marketing/cupons")({
  head: () => ({ meta: [{ title: "Cupons de Desconto — Hr Shoes" }] }),
  loader: async () => {
    const res = await listCoupons();
    if (res.status === "error") throw new Error(res.message);
    return res.data || [];
  },
  component: CouponsPage,
});

function CouponsPage() {
  const coupons = Route.useLoaderData() || [];
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed_amount" | "free_shipping">("percentage");
  const [value, setValue] = useState("");
  const [minOrderCentsInput, setMinOrderCentsInput] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setIsSaving(true);
    try {
      const discount_value = type === "free_shipping" ? 0 : parseFloat(value.replace(",", "."));
      const min_order_cents = minOrderCentsInput
        ? Math.round(parseFloat(minOrderCentsInput.replace(",", ".")) * 100)
        : null;

      const res = await upsertCoupon({
        data: {
          code: code.toUpperCase(),
          discount_type: type,
          discount_value,
          min_order_cents,
          is_active: true,
        },
      });

      if (res.status === "success") {
        toast.success("Cupom criado com sucesso!");
        setOpen(false);
        setCode("");
        setValue("");
        setMinOrderCentsInput("");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar cupom");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado ao salvar cupom");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (coupon: any, active: boolean) => {
    try {
      const res = await upsertCoupon({
        data: {
          id: coupon.id,
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          min_order_cents: coupon.min_order_cents,
          is_active: active,
        },
      });
      if (res.status === "error") throw new Error(res.message);
      toast.success(`Cupom ${active ? "ativado" : "desativado"}.`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar cupom.");
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("Deseja realmente excluir este cupom promocional?")) return;
    try {
      const res = await deleteCoupon({ data: { id: couponId } });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Cupom excluído com sucesso.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir cupom.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing & Promoções"
        title="Cupons de Desconto"
        description="Crie códigos promocionais (% de desconto, valor fixo ou frete grátis) para impulsionar suas vendas."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" />
                Criar Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Cupom de Desconto</DialogTitle>
                <DialogDescription>Cadastre o código e as regras de aplicação do cupom.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="c-code">Código do Cupom *</Label>
                  <Input
                    id="c-code"
                    placeholder="Ex: BEMVINDO10 ou PROMO2026"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-type">Tipo de Desconto</Label>
                    <Select value={type} onValueChange={(val: any) => setType(val)}>
                      <SelectTrigger id="c-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed_amount">Valor Fixo (R$)</SelectItem>
                        <SelectItem value="free_shipping">Frete Grátis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-val">Valor do Desconto *</Label>
                    <Input
                      id="c-val"
                      type="number"
                      step="0.01"
                      placeholder={type === "percentage" ? "10%" : "20.00"}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      disabled={type === "free_shipping"}
                      required={type !== "free_shipping"}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-min">Valor Mínimo de Pedido (R$)</Label>
                  <Input
                    id="c-min"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 150.00 (Deixe em branco para sem mínimo)"
                    value={minOrderCentsInput}
                    onChange={(e) => setMinOrderCentsInput(e.target.value)}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving} className="font-bold">
                    {isSaving ? "Salvando..." : "Salvar Cupom"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {coupons.length === 0 ? (
        <EmptyState
          title="Nenhum cupom ativo"
          description="Você ainda não criou cupons de desconto. Clique no botão acima para cadastrar seu primeiro código promocional."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Código do Cupom</TableHead>
                <TableHead>Tipo & Valor</TableHead>
                <TableHead>Valor Mínimo</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c: any) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-bold text-sm text-foreground">
                    <Badge variant="outline" className="font-mono text-xs">
                      {c.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {c.discount_type === "percentage"
                      ? `${c.discount_value}% OFF`
                      : c.discount_type === "free_shipping"
                        ? "Frete Grátis"
                        : formatMoney(c.discount_value * 100)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.min_order_cents ? formatMoney(c.min_order_cents) : "Sem mínimo"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {c.uses_count ?? 0} {c.max_uses ? `/ ${c.max_uses}` : "usos"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={c.is_active}
                      onCheckedChange={(active) => handleToggleActive(c, active)}
                      aria-label={`Ativar cupom ${c.code}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

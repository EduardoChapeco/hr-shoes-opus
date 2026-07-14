import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Ticket, Plus } from "lucide-react";

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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { listCoupons, upsertCoupon } from "@/services/growth.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/marketing/cupons")({
  head: () => ({ meta: [{ title: "Cupons de Desconto — Hr Shoes" }] }),
  loader: async () => {
    const res = await listCoupons();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
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
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value) return;
    
    setIsSaving(true);
    try {
      const res = await upsertCoupon({
        data: {
          code: code.toUpperCase(),
          discount_type: type,
          discount_value: parseFloat(value),
          is_active: true
        }
      });
      
      if (res.status === "success") {
        toast.success("Cupom salvo!");
        setOpen(false);
        setCode("");
        setValue("");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar cupom");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cupons de Desconto"
        description="Crie e gerencie códigos promocionais para seus clientes."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Cupom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cupom</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código</label>
                  <Input 
                    placeholder="Ex: BEMVINDO10" 
                    value={code} 
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select value={type} onValueChange={(val: any) => setType(val)}>
                      <SelectTrigger>
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
                    <label className="text-sm font-medium">Valor</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="Ex: 10" 
                      value={value} 
                      onChange={e => setValue(e.target.value)}
                      disabled={type === "free_shipping"}
                      required={type !== "free_shipping"}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar Cupom"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {coupons.length === 0 ? (
        <EmptyState
          title="Nenhum cupom criado"
          description="Você ainda não criou cupons de desconto. Clique no botão acima para começar."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold">{c.code}</TableCell>
                  <TableCell>
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : 
                     c.discount_type === "free_shipping" ? "Frete Grátis" :
                     formatMoney(c.discount_value * 100)}
                  </TableCell>
                  <TableCell>
                    {c.uses_count} {c.max_uses ? `/ ${c.max_uses}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? "default" : "secondary"}>
                      {c.is_active ? "Ativo" : "Inativo"}
                    </Badge>
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

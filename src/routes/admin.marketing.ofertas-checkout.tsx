import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Plus, Trash2, Edit2 } from "lucide-react";

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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { listAdminProducts } from "@/services/admin-catalog.functions";
import { listUpsellRules, createUpsellRule, updateUpsellRule, deleteUpsellRule } from "@/services/upsell.functions";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/marketing/ofertas-checkout")({
  head: () => ({ meta: [{ title: "Ofertas de Checkout (Upsell) — Hr Shoes" }] }),
  loader: async () => {
    const [rules, productsRes] = await Promise.all([
      listUpsellRules(),
      listAdminProducts(),
    ]);
    if (productsRes.status === "error") throw new Error(productsRes.message);
    return {
      rules: rules || [],
      products: productsRes.data || [],
    };
  },
  component: CheckoutOffersPage,
});

function CheckoutOffersPage() {
  const { rules, products } = Route.useLoaderData();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [triggerProductId, setTriggerProductId] = useState("");
  const [offerProductId, setOfferProductId] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("10");
  const [active, setActive] = useState(true);

  const handleOpenCreate = () => {
    setEditingRuleId(null);
    setTriggerProductId("");
    setOfferProductId("");
    setDiscountPercentage("10");
    setActive(true);
    setOpen(true);
  };

  const handleOpenEdit = (rule: any) => {
    setEditingRuleId(rule.id);
    setTriggerProductId(rule.trigger_product_id);
    setOfferProductId(rule.offer_product_id);
    setDiscountPercentage(rule.discount_percentage.toString());
    setActive(rule.active);
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerProductId || !offerProductId) {
      toast.error("Por favor, selecione ambos os produtos.");
      return;
    }
    if (triggerProductId === offerProductId) {
      toast.error("O produto gatilho e o produto de oferta devem ser diferentes.");
      return;
    }

    const discount = parseInt(discountPercentage);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      toast.error("Desconto inválido. Use um valor entre 0 e 100.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingRuleId) {
        await updateUpsellRule({
          data: {
            id: editingRuleId,
            trigger_product_id: triggerProductId,
            offer_product_id: offerProductId,
            discount_percentage: discount,
            active,
          },
        });
        toast.success("Regra de upsell atualizada com sucesso!");
      } else {
        await createUpsellRule({
          data: {
            trigger_product_id: triggerProductId,
            offer_product_id: offerProductId,
            discount_percentage: discount,
            active,
          },
        });
        toast.success("Regra de upsell criada com sucesso!");
      }
      setOpen(false);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar regra de upsell");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (rule: any, newActive: boolean) => {
    try {
      await updateUpsellRule({
        data: {
          id: rule.id,
          trigger_product_id: rule.trigger_product_id,
          offer_product_id: rule.offer_product_id,
          discount_percentage: rule.discount_percentage,
          active: newActive,
        },
      });
      toast.success(`Regra ${newActive ? "ativada" : "desativada"} com sucesso.`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar regra.");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteUpsellRule({ data: { id: deleteConfirmId } });
      toast.success("Regra de upsell excluída com sucesso.");
      setDeleteConfirmId(null);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir regra.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing & Promoções"
        title="Ofertas de Checkout (Upsell)"
        description="Aumente o ticket médio da sua loja sugerindo produtos adicionais com desconto diretamente no carrinho ou checkout."
        actions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-1.5 size-4" />
            Criar Nova Regra
          </Button>
        }
      />

      {rules.length === 0 ? (
        <EmptyState
          title="Nenhuma regra de upsell cadastrada"
          description="Você ainda não configurou ofertas de compre junto. Clique em 'Criar Nova Regra' para configurar."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Produto Gatilho (Trigger)</TableHead>
                <TableHead>Produto Ofertado (Upsell)</TableHead>
                <TableHead>Desconto (%)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule: any) => (
                <TableRow key={rule.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-semibold text-xs text-foreground">
                    {rule.trigger_product?.title || "Produto desconhecido"}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-primary">
                    {rule.offer_product?.title || "Produto desconhecido"}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-foreground">
                    <Badge variant="outline" className="font-mono text-xs">
                      {rule.discount_percentage}% OFF
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={rule.active}
                      onCheckedChange={(val) => handleToggleActive(rule, val)}
                      aria-label="Ativar/Desativar regra"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:bg-muted"
                        onClick={() => handleOpenEdit(rule)}
                        title="Editar regra"
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteConfirmId(rule.id)}
                        title="Excluir regra"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* dialog de cadastro/edição */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRuleId ? "Editar Regra de Upsell" : "Nova Regra de Upsell"}
            </DialogTitle>
            <DialogDescription>
              Defina o produto gatilho que ativará a oferta no carrinho e o produto adicional oferecido com desconto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="trigger-product">Produto Gatilho *</Label>
              <Select value={triggerProductId} onValueChange={setTriggerProductId}>
                <SelectTrigger id="trigger-product">
                  <SelectValue placeholder="Selecione o produto que ativa a oferta" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-product">Produto Ofertado *</Label>
              <Select value={offerProductId} onValueChange={setOfferProductId}>
                <SelectTrigger id="offer-product">
                  <SelectValue placeholder="Selecione o produto que será ofertado" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (%) *</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Ex: 10"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 flex flex-col justify-end pb-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rule-active"
                    checked={active}
                    onCheckedChange={setActive}
                  />
                  <Label htmlFor="rule-active">Regra Ativa</Label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="font-bold">
                {isSaving ? "Salvando..." : "Salvar Regra"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* alert dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir esta regra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e a regra de upsell deixará de ser sugerida aos clientes no checkout imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

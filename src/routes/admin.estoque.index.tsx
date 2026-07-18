import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Boxes,
  PackageCheck,
  Clock,
  AlertTriangle,
  Plus,
  Minus,
  Search,
  History,
  ArrowRightLeft,
  Truck,
  ShieldAlert,
  SlidersHorizontal,
  Box,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/state/states";
import { getStockLevels, adjustStock } from "@/services/stock.functions";
import { StockAuditDialog } from "@/components/admin/stock-audit-dialog";

export const Route = createFileRoute("/admin/estoque/")({
  head: () => ({ meta: [{ title: "Estoque Operacional — Hr Shoes" }] }),
  loader: async () => {
    const res = await getStockLevels({ data: {} });
    return res.status === "ok" ? res.data : [];
  },
  component: AdminStockPage,
});

function AdminStockPage() {
  const initialStock = Route.useLoaderData();
  const router = useRouter();
  const [stock, setStock] = useState<any[]>(initialStock);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<string>("all");
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal Movement State
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [movementType, setMovementType] = useState<
    "purchase" | "adjustment" | "damage" | "transfer" | "return"
  >("purchase");
  const [qtyInput, setQtyInput] = useState<string>("1");
  const [noteInput, setNoteInput] = useState<string>("");

  // Metrics summary
  const metrics = useMemo(() => {
    const totalSKUs = stock.length;
    let totalOnHand = 0;
    let totalReserved = 0;
    let criticalCount = 0;

    for (const v of stock) {
      const onHand = v.stock_on_hand ?? 0;
      const reserved = v.stock_reserved ?? 0;
      totalOnHand += onHand;
      totalReserved += reserved;
      if (onHand - reserved <= 5) criticalCount++;
    }

    return {
      totalSKUs,
      totalOnHand,
      totalReserved,
      totalAvailable: Math.max(0, totalOnHand - totalReserved),
      criticalCount,
    };
  }, [stock]);

  // Filter stock rows by search & tab
  const filteredStock = useMemo(() => {
    return stock.filter((v) => {
      const available = (v.stock_on_hand ?? 0) - (v.stock_reserved ?? 0);
      const matchesSearch =
        v.sku.toLowerCase().includes(search.toLowerCase()) ||
        (v.products?.title || "").toLowerCase().includes(search.toLowerCase());

      let matchesTab = true;
      if (statusTab === "available") matchesTab = available > 5;
      else if (statusTab === "critical") matchesTab = available > 0 && available <= 5;
      else if (statusTab === "out_of_stock") matchesTab = available <= 0;

      return matchesSearch && matchesTab;
    });
  }, [stock, search, statusTab]);

  // Open Dialog for line operation
  const handleOpenMovementModal = (variant: any, defaultType: any = "purchase") => {
    setSelectedVariant(variant);
    setMovementType(defaultType);
    setQtyInput("1");
    setNoteInput("");
  };

  // Submit Movement to server RPC adjust_stock
  const handleExecuteMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || isUpdating) return;

    const parsedQty = parseInt(qtyInput, 10);
    if (isNaN(parsedQty) || parsedQty === 0) {
      toast.error("Informe uma quantidade válida diferente de zero.");
      return;
    }

    if ((movementType === "damage" || movementType === "transfer") && !noteInput.trim()) {
      toast.error("Justificativa é obrigatória para perdas/avarias e transferências.");
      return;
    }

    // Determine final signed qty for RPC (negative for damage/output)
    const finalQty =
      movementType === "damage" ? -Math.abs(parsedQty) : parsedQty;

    setIsUpdating(true);
    try {
      const res = await adjustStock({
        data: {
          variantId: selectedVariant.id,
          qty: finalQty,
          movementType,
          note: noteInput || `Movimentação ${movementType}`,
        },
      });

      if (res.status === "ok") {
        toast.success("Movimentação registrada com sucesso no banco de dados.");
        setSelectedVariant(null);

        // Optimistic update
        setStock((prev) =>
          prev.map((v) => {
            if (v.id === selectedVariant.id) {
              return {
                ...v,
                stock_on_hand: Math.max(0, (v.stock_on_hand ?? 0) + finalQty),
              };
            }
            return v;
          }),
        );
        router.invalidate();
      } else {
        toast.error((res as any).message || "Erro ao atualizar estoque.");
      }
    } catch (e: any) {
      toast.error("Erro inesperado ao registrar estoque.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operação Comercial"
        title="Estoque Operacional"
        description="Controle de saldos em mãos, reservas de checkout e movimentações imutáveis com rastreabilidade."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/estoque/alertas">
                <AlertTriangle className="mr-1.5 size-4 text-amber-600" />
                Alertas ({metrics.criticalCount})
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/estoque/movimentos">
                <History className="mr-1.5 size-4" />
                Histórico de Movimentos
              </Link>
            </Button>
          </div>
        }
      />

      {/* Grid de KPIs de Estoque */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total de SKUs
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Boxes className="size-4" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalSKUs}</div>
            <p className="text-xs text-muted-foreground mt-1">Variações cadastradas</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estoque em Mãos
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <PackageCheck className="size-4" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalOnHand} un.</div>
            <p className="text-xs text-muted-foreground mt-1">Físico em depósito</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reservado (Checkout)
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
              <Clock className="size-4" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalReserved} un.</div>
            <p className="text-xs text-muted-foreground mt-1">Bloqueados em pedidos</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estoque Crítico
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <ShieldAlert className="size-4" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.criticalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">SKUs com 5 un. ou menos</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar & Filtros por Status */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Tabs defaultValue="all" value={statusTab} onValueChange={setStatusTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all" className="text-xs">
              Todos ({stock.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="text-xs">
              Regular ({stock.filter((v) => (v.stock_on_hand ?? 0) - (v.stock_reserved ?? 0) > 5).length})
            </TabsTrigger>
            <TabsTrigger value="critical" className="text-xs">
              Crítico ({metrics.criticalCount})
            </TabsTrigger>
            <TabsTrigger value="out_of_stock" className="text-xs">
              Esgotado ({stock.filter((v) => (v.stock_on_hand ?? 0) - (v.stock_reserved ?? 0) <= 0).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="Buscar por SKU ou Nome do Produto..."
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Estoque */}
      {stock.length === 0 ? (
        <EmptyState
          title="Sem variações cadastradas"
          description="O estoque é gerado automaticamente a partir das variações de SKUs cadastradas nos Produtos."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Em Mãos</TableHead>
                <TableHead className="text-right">Reservado</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead className="text-center">Nível</TableHead>
                <TableHead className="text-center">Operar Estoque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map((variant) => {
                const onHand = variant.stock_on_hand ?? 0;
                const reserved = variant.stock_reserved ?? 0;
                const available = Math.max(0, onHand - reserved);

                return (
                  <TableRow key={variant.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold">{variant.sku}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {variant.products?.title || "Produto sem título"}
                        </span>
                        {variant.products?.status !== "published" && (
                          <Badge variant="secondary" className="text-[10px]">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-semibold">{onHand}</TableCell>

                    <TableCell className="text-right text-muted-foreground">{reserved}</TableCell>

                    <TableCell className="text-right font-bold text-sm">
                      {available}
                    </TableCell>

                    <TableCell className="text-center">
                      {available <= 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          Esgotado
                        </Badge>
                      ) : available <= 5 ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                          Crítico
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                          Regular
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleOpenMovementModal(variant, "purchase")}
                        >
                          <Plus className="size-3.5 mr-1" /> Entrada
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleOpenMovementModal(variant, "damage")}
                        >
                          <Minus className="size-3.5 mr-1" /> Avaria
                        </Button>
                        <StockAuditDialog variant={variant} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredStock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                    Nenhum SKU encontrado para os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal / Dialog de Movimentação por Linha */}
      <Dialog open={Boolean(selectedVariant)} onOpenChange={(open) => !open && setSelectedVariant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              SKU: <strong className="font-mono text-foreground">{selectedVariant?.sku}</strong> (
              {selectedVariant?.products?.title})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExecuteMovement} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tipo de Movimentação</Label>
              <Select
                value={movementType}
                onValueChange={(val: any) => setMovementType(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Entrada por Compra (Fornecedor)</SelectItem>
                  <SelectItem value="adjustment">Ajuste Manual de Inventário</SelectItem>
                  <SelectItem value="damage">Perda / Avaria (Saída Físico)</SelectItem>
                  <SelectItem value="transfer">Transferência entre Filiais</SelectItem>
                  <SelectItem value="return">Devolução de Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                {movementType === "damage"
                  ? "A quantidade será deduzida automaticamente do saldo em mãos."
                  : "A quantidade será adicionada ao saldo em mãos."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Justificativa / Observação{" "}
                {(movementType === "damage" || movementType === "transfer") && "*"}
              </Label>
              <Input
                placeholder="Ex: Nota fiscal 4092, caixa avariada no frete..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                required={movementType === "damage" || movementType === "transfer"}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setSelectedVariant(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Gravando..." : "Confirmar Movimentação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

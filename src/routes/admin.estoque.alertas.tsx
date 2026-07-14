import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/state/states";
import { getStockLevels, adjustStock } from "@/services/stock.functions";

export const Route = createFileRoute("/admin/estoque/alertas")({
  head: () => ({ meta: [{ title: "Alertas de Estoque — Hr Shoes" }] }),
  loader: async () => {
    const res = await getStockLevels({ data: {} });
    if (res.status === "error") throw new Error(res.message);
    // Filter for low stock (on_hand <= 5) or out of stock
    return (res.data || []).filter((v: any) => v.stock_on_hand - (v.stock_reserved || 0) <= 5);
  },
  component: StockAlertsPage,
});

function StockAlertsPage() {
  const variants = Route.useLoaderData();
  const router = useRouter();
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const handleQuickRefill = async (variantId: string) => {
    setAdjustingId(variantId);
    try {
      const res = await adjustStock({
        data: {
          variantId,
          qty: 10,
          movementType: "purchase",
          note: "Reposição rápida via alerta de estoque",
        },
      });
      if (res.status === "error") throw new Error(res.message);
      toast.success("10 unidades adicionadas ao estoque.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao repor estoque");
    } finally {
      setAdjustingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de Estoque"
        description="Variantes com estoque disponível crítico (5 unidades ou menos)."
      />

      {variants.length === 0 ? (
        <EmptyState
          title="Nenhum alerta"
          description="Todos os produtos com estoque ativo estão acima do nível mínimo."
        />
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Em Mãos</TableHead>
                <TableHead className="text-center">Reservado</TableHead>
                <TableHead className="text-center">Disponível</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ação Rápida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v: any) => {
                const available = v.stock_on_hand - (v.stock_reserved || 0);
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.products?.title || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{v.sku}</TableCell>
                    <TableCell className="text-center">{v.stock_on_hand}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {v.stock_reserved || 0}
                    </TableCell>
                    <TableCell className="text-center font-semibold">{available}</TableCell>
                    <TableCell className="text-center">
                      {available <= 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Esgotado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Crítico
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickRefill(v.id)}
                        disabled={adjustingId === v.id}
                      >
                        +10 unidades
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

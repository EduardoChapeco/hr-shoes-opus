import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Plus, Minus, Search } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { getStockLevels, adjustStock } from "@/services/stock.functions";

export const Route = createFileRoute("/admin/estoque/")({
  head: () => ({ meta: [{ title: "Estoque — Hr Shoes" }] }),
  loader: async () => {
    const res = await getStockLevels();
    return res.status === "ok" ? res.data : [];
  },
  component: AdminStockPage,
});

function AdminStockPage() {
  const initialStock = Route.useLoaderData();
  const [stock, setStock] = useState(initialStock);
  const [search, setSearch] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Simplified manual adjustment (adds to on_hand stock)
  const handleAdjust = async (variantId: string, qty: number, type: "adjustment" | "damage") => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await adjustStock({
        data: {
          variantId,
          qty,
          movementType: type,
          note: type === "damage" ? "Avaria reportada" : "Ajuste manual",
        },
      });
      if (res.status === "ok") {
        // Optimistic update
        setStock((prev: any) =>
          prev.map((v: any) => {
            if (v.id === variantId) {
              return { ...v, stock_on_hand: Math.max(0, v.stock_on_hand + qty) };
            }
            return v;
          }),
        );
      } else {
        alert(res.message);
      }
    } catch (e) {
      alert("Erro ao atualizar o estoque.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredStock = stock.filter(
    (v: any) =>
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      (v.products?.title || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operação"
        title="Estoque"
        description="Controle a disponibilidade dos seus produtos por SKU."
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por SKU ou Produto..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {stock.length === 0 ? (
        <EmptyState
          title="Sem variações cadastradas"
          description="O estoque é gerado automaticamente a partir das variações (tamanho/cor) cadastradas nos Produtos."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Em Mãos</TableHead>
                <TableHead className="text-right">Reservado</TableHead>
                <TableHead className="text-center">Ajuste Rápido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map((variant: any) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-mono text-sm font-medium">{variant.sku}</TableCell>
                  <TableCell>
                    {variant.products?.title}
                    {variant.products?.status !== "published" && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{variant.stock_on_hand}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {variant.stock_reserved}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-green-600"
                        disabled={isUpdating}
                        onClick={() => handleAdjust(variant.id, 1, "adjustment")}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-red-600"
                        disabled={isUpdating || variant.stock_on_hand <= 0}
                        onClick={() => handleAdjust(variant.id, -1, "damage")}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum SKU encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

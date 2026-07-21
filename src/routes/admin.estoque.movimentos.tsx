import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/commerce/page-header";
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
import { getStockMovements } from "@/services/stock.functions";

export const Route = createFileRoute("/admin/estoque/movimentos")({
  head: () => ({ meta: [{ title: "Movimentos de estoque — Hr Shoes" }] }),
  loader: async () => {
    return await getStockMovements({ data: { limit: 100 } }) || [];
  },
  component: MovementsPage,
});

function getBadgeVariant(qty: number) {
  return qty > 0 ? "default" : qty < 0 ? "destructive" : "secondary";
}

function translateMovementType(type: string) {
  const map: Record<string, string> = {
    purchase: "Entrada de Fornecedor",
    sale: "Venda Concluída",
    reserve: "Reserva de Checkout",
    release: "Reserva Liberada",
    return: "Devolução",
    exchange_in: "Entrada de Troca",
    exchange_out: "Saída de Troca",
    adjustment: "Ajuste Manual",
    transfer: "Transferência",
    damage: "Avaria",
  };
  return map[type] || type;
}

function MovementsPage() {
  const movements = Route.useLoaderData() ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimentações de Estoque"
        description="Histórico imutável de todas as entradas, saídas, reservas e ajustes."
      />

      {movements.length === 0 ? (
        <EmptyState
          title="Nenhum movimento"
          description="Nenhuma alteração de estoque foi registrada ainda."
        />
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto / SKU</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Referência / Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((mov: any) => (
                <TableRow key={mov.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {mov.variant?.product?.title || "Desconhecido"}
                    </div>
                    <div className="text-xs text-muted-foreground">{mov.variant?.sku}</div>
                  </TableCell>
                  <TableCell>{translateMovementType(mov.movement_type)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getBadgeVariant(mov.qty)}>
                      {mov.qty > 0 ? `+${mov.qty}` : mov.qty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {mov.reference_type && (
                        <span className="font-medium mr-1">{mov.reference_type}:</span>
                      )}
                      <span className="text-muted-foreground">{mov.note || "-"}</span>
                    </div>
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

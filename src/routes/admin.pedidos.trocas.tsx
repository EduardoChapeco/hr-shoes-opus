import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { listExchanges, updateExchangeStatus } from "@/services/exchanges.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/pedidos/trocas")({
  head: () => ({ meta: [{ title: "Trocas e Devoluções — Hr Shoes" }] }),
  loader: async () => {
    return await listExchanges();
  },
  component: ExchangesPage,
});

function translateStatus(status: string) {
  const map: Record<string, string> = {
    requested: "Solicitada",
    approved: "Aprovada",
    received: "Recebida (Estoque Restabelecido)",
    rejected: "Rejeitada",
    refunded: "Estornada",
  };
  return map[status] || status;
}

function ExchangesPage() {
  const exchanges = Route.useLoaderData();
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, status: any, refundCents?: number) => {
    setProcessingId(id);
    try {
      const res = await updateExchangeStatus({ data: { exchangeId: id, status, refundCents } });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Status atualizado com sucesso!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trocas e Devoluções"
        description="Gerencie solicitações de troca, receba devoluções no estoque e realize estornos."
      />

      {exchanges.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação"
          description="Ainda não existem solicitações de troca ou devolução."
        />
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchanges.map((ex: any) => (
                <TableRow key={ex.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(ex.requestedAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-medium">#{ex.orderToken}</TableCell>
                  <TableCell>{ex.customerName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{ex.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{translateStatus(ex.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {ex.status === "requested" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUpdate(ex.id, "approved")}
                            disabled={processingId === ex.id}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdate(ex.id, "rejected")}
                            disabled={processingId === ex.id}
                          >
                            Rejeitar
                          </Button>
                        </>
                      )}

                      {ex.status === "approved" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdate(ex.id, "received")}
                          disabled={processingId === ex.id}
                        >
                          Confirmar Recebimento
                        </Button>
                      )}

                      {ex.status === "received" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdate(ex.id, "refunded", ex.orderTotal)}
                          disabled={processingId === ex.id}
                        >
                          Estornar {formatMoney(ex.orderTotal)}
                        </Button>
                      )}
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

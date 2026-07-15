import { createFileRoute } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { listExchanges, updateExchangeStatus } from "@/services/exchanges.functions";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/trocas")({
  head: () => ({ meta: [{ title: "Trocas e Devoluções — Hr Shoes" }] }),
  loader: async () => {
    return await listExchanges();
  },
  component: ExchangesPage,
});

function ExchangesPage() {
  const exchanges = Route.useLoaderData();
  const router = useRouter();

  const handleStatusChange = async (exchangeId: string, newStatus: any) => {
    try {
      await updateExchangeStatus({ data: { exchangeId, status: newStatus } });
      toast.success("Status atualizado");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return <Badge variant="secondary">Solicitada</Badge>;
      case "approved":
        return <Badge variant="info">Aprovada</Badge>;
      case "received":
        return <Badge variant="warning">Recebida</Badge>;
      case "refunded":
        return <Badge variant="success">Reembolsada</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trocas e Devoluções"
        description="Gestão de logística reversa e reembolsos."
      />

      {exchanges.length === 0 ? (
        <EmptyState
          title="Nenhuma troca solicitada"
          description="Você ainda não tem solicitações de trocas pendentes."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchanges.map((ex: any) => (
                <TableRow key={ex.id}>
                  <TableCell className="font-medium">#{ex.orderToken}</TableCell>
                  <TableCell>{ex.customerName}</TableCell>
                  <TableCell>{new Date(ex.requestedAt).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={ex.reason}>
                    {ex.reason}
                  </TableCell>
                  <TableCell>{getStatusBadge(ex.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {ex.status === "requested" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(ex.id, "approved")}
                        >
                          Aprovar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStatusChange(ex.id, "rejected")}
                        >
                          Rejeitar
                        </Button>
                      </>
                    )}
                    {ex.status === "approved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(ex.id, "received")}
                      >
                        Marcar Recebido
                      </Button>
                    )}
                    {ex.status === "received" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleStatusChange(ex.id, "refunded")}
                      >
                        Reembolsar
                      </Button>
                    )}
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

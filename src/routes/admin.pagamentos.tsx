import { createFileRoute } from "@tanstack/react-router";
import { formatMoney } from "@/lib/money";
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
import { listPayments, updateOrderStatus } from "@/services/order.functions";
import { useState } from "react";

export const Route = createFileRoute("/admin/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — Hr Shoes" }] }),
  loader: async () => {
    const res = await listPayments();
    return res.status === "ok" ? res.data : [];
  },
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const initialPayments = Route.useLoaderData();
  const [payments, setPayments] = useState(initialPayments);

  const handleApprove = async (id: string) => {
    const res = await updateOrderStatus({ data: { orderId: id, status: "paid" } });
    if (res.status === "ok") {
      setPayments(payments.map((p: any) => (p.id === id ? { ...p, status: "paid" } : p)));
    } else {
      alert("Erro ao aprovar");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendas"
        title="Pagamentos"
        description="Conciliação de pagamentos manuais (PIX/Transferência)."
      />

      {payments.length === 0 ? (
        <EmptyState
          title="Nenhum pagamento pendente"
          description="Os pedidos aguardando confirmação de pagamento aparecerão aqui."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p: any) => {
                const date = new Date(p.created_at).toLocaleDateString("pt-BR");
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      #{p.public_token}
                    </TableCell>
                    <TableCell>{date}</TableCell>
                    <TableCell>{p.customer_name || "Desconhecido"}</TableCell>
                    <TableCell>{formatMoney(p.total_cents)}</TableCell>
                    <TableCell>
                      {p.status === "awaiting_payment" ? (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Aguardando
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-600">
                          Aprovado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "awaiting_payment" && (
                        <Button size="sm" onClick={() => handleApprove(p.id)}>
                          Aprovar
                        </Button>
                      )}
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

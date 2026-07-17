import { createFileRoute, Link } from "@tanstack/react-router";
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
import { listPayments } from "@/services/order.functions";
import { approvePayment } from "@/services/payment.functions";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

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
  const [approving, setApproving] = useState<string | null>(null);
  const router = useRouter();

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      const res = await approvePayment({ data: { orderId: id, receivedMethod: "bank_transfer" } });
      if (res.status === "success") {
        toast.success("Pagamento aprovado! O pedido está em separação.");
        router.invalidate();
      } else {
        toast.error((res as any).message || "Erro ao aprovar pagamento");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado ao aprovar");
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendas"
        title="Pagamentos"
        description="Conciliação de pagamentos manuais (PIX/Transferência). Aprovar confirma o recebimento."
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
                // customer_snapshot is a JSONB column with { name, email, phone }
                const customerName = p.customer_snapshot?.name || "Desconhecido";
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      <Link
                        to="/admin/pedidos/$id"
                        params={{ id: p.id }}
                        className="hover:underline text-primary"
                      >
                        #{p.public_token}
                      </Link>
                    </TableCell>
                    <TableCell>{date}</TableCell>
                    <TableCell>{customerName}</TableCell>
                    <TableCell>{formatMoney(p.total_cents)}</TableCell>
                    <TableCell>
                      {p.status === "awaiting_payment" ? (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Aguardando
                        </Badge>
                      ) : p.status === "payment_processing" ? (
                        <Badge variant="secondary">Comprovante Enviado</Badge>
                      ) : (
                        <Badge className="bg-green-600 hover:bg-green-700">Aprovado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {(p.status === "awaiting_payment" || p.status === "payment_processing") && (
                        <Button
                          size="sm"
                          disabled={approving === p.id}
                          onClick={() => handleApprove(p.id)}
                        >
                          {approving === p.id ? "Aprovando..." : "Aprovar"}
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

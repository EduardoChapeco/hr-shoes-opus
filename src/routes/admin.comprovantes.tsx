import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, X, FileText } from "lucide-react";

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
import { listPendingManualPayments, approvePayment } from "@/services/payment.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/comprovantes")({
  head: () => ({ meta: [{ title: "Comprovantes — Hr Shoes" }] }),
  loader: async () => {
    const res = await listPendingManualPayments();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: ReceiptsPage,
});

function ReceiptsPage() {
  const receipts = Route.useLoaderData() || [];
  const router = useRouter();

  const handleApprove = async (orderId: string) => {
    try {
      const res = await approvePayment({ data: { orderId } });
      if (res.status === "success") {
        toast.success("Pagamento aprovado. O pedido será separado!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao aprovar pagamento.");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comprovantes e Pix"
        description="Analise os comprovantes manuais enviados via WhatsApp e aprove os pedidos."
      />

      {receipts.length === 0 ? (
        <EmptyState
          title="Nenhum comprovante pendente"
          description="Todos os pedidos recentes já estão com pagamento confirmado ou foram cancelados."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    #{r.public_token}
                  </TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-semibold">{formatMoney(r.total_cents)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Aguardando Pagamento</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        onClick={() => handleApprove(r.id)}
                        title="Aprovar Pagamento Manual"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        title="Rejeitar Pagamento"
                      >
                        <X className="h-4 w-4" />
                      </Button>
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

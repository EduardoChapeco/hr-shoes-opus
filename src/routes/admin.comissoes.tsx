import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DollarSign, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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
import { listCommissions, payCommission } from "@/services/commission.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/comissoes")({
  head: () => ({ meta: [{ title: "Comissões — Hr Shoes" }] }),
  loader: async () => {
    return await listCommissions();
  },
  component: CommissionsPage,
});

function CommissionsPage() {
  const commissions = Route.useLoaderData();
  const router = useRouter();

  const handlePay = async (id: string) => {
    try {
      await payCommission({ data: { commissionId: id } });
      toast.success("Comissão marcada como paga.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao pagar comissão");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissões de Vendas"
        description="Gestão de pagamento de comissões por pedido."
      />

      {commissions.length === 0 ? (
        <EmptyState title="Sem comissões" description="Nenhuma comissão registrada nesta loja." />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor(a)</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Valor do Pedido</TableHead>
                <TableHead>Comissão (R$)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.sellerName}</TableCell>
                  <TableCell>#{c.orderToken}</TableCell>
                  <TableCell>{formatMoney(c.orderTotal)}</TableCell>
                  <TableCell className="font-bold text-primary">
                    {formatMoney(c.amountCents)}
                  </TableCell>
                  <TableCell>
                    {c.status === "paid" ? (
                      <Badge className="bg-green-600">Paga</Badge>
                    ) : c.status === "cancelled" ? (
                      <Badge variant="destructive">Cancelada</Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => handlePay(c.id)}>
                        <CheckCircle className="mr-2 h-3 w-3" />
                        Pagar
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

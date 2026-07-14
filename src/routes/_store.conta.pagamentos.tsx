import { createFileRoute } from "@tanstack/react-router";
import { Receipt, FileText } from "lucide-react";

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
import { getCustomerInstallments } from "@/services/installments.functions";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_store/conta/pagamentos")({
  head: () => ({ meta: [{ title: "Carnês e Faturas — Hr Shoes" }] }),
  loader: async () => {
    return await getCustomerInstallments();
  },
  component: CustomerInstallmentsPage,
});

function CustomerInstallmentsPage() {
  const plans = Route.useLoaderData();

  if (plans.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Carnês e Faturas"
          description="Seus parcelamentos ativos via crediário da loja."
        />
        <EmptyState
          title="Nenhum carnê encontrado"
          description="Você não possui compras feitas via carnê/crediário no momento."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carnês e Faturas"
        description="Seus parcelamentos ativos via crediário da loja."
      />

      <div className="space-y-8">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Pedido #{plan.orderToken}
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  Gerado em {new Date(plan.createdAt).toLocaleDateString("pt-BR")} — Total:{" "}
                  {formatMoney(plan.totalCents)}
                </div>
              </div>
              <Badge
                variant={
                  plan.status === "active"
                    ? "default"
                    : plan.status === "paid_off"
                      ? "secondary"
                      : "destructive"
                }
              >
                {plan.status === "active"
                  ? "Ativo"
                  : plan.status === "paid_off"
                    ? "Quitado"
                    : "Em Atraso"}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.installments.map((inst: any, idx: number) => {
                    const isLate = inst.status === "pending" && new Date(inst.dueDate) < new Date();
                    return (
                      <TableRow key={inst.id}>
                        <TableCell className="font-medium">{idx + 1}ª</TableCell>
                        <TableCell>{new Date(inst.dueDate).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{formatMoney(inst.amountCents)}</TableCell>
                        <TableCell>
                          {inst.status === "paid" ? (
                            <Badge variant="success">Paga</Badge>
                          ) : isLate ? (
                            <Badge variant="destructive">Atrasada</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {inst.paidAt ? new Date(inst.paidAt).toLocaleDateString("pt-BR") : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

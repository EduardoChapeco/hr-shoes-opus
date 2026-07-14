import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";

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
import { listRegisterShifts } from "@/services/cash.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/caixa/turnos")({
  head: () => ({ meta: [{ title: "Turnos de Caixa — Hr Shoes" }] }),
  loader: async () => {
    return await listRegisterShifts();
  },
  component: ShiftsPage,
});

function ShiftsPage() {
  const shifts = Route.useLoaderData();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-600">Aberto</Badge>;
      case "closed":
        return <Badge className="bg-slate-600">Fechado</Badge>;
      case "discrepancy":
        return <Badge variant="destructive">Diferença</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de Turnos"
        description="Consulte os caixas fechados e abertos da loja."
      />

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aberto em</TableHead>
              <TableHead>Aberto por</TableHead>
              <TableHead>Fechado em</TableHead>
              <TableHead>Fundo</TableHead>
              <TableHead>Final (Gaveta)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  {new Date(s.opened_at).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell>{s.opened_by_profile?.full_name || "Desconhecido"}</TableCell>
                <TableCell>
                  {s.closed_at
                    ? new Date(s.closed_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "-"}
                </TableCell>
                <TableCell>{formatMoney(s.initial_balance_cents)}</TableCell>
                <TableCell>
                  {s.final_balance_cents !== null ? formatMoney(s.final_balance_cents) : "-"}
                </TableCell>
                <TableCell>{getStatusBadge(s.status)}</TableCell>
              </TableRow>
            ))}
            {shifts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Nenhum turno registrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/state/states";
import { getAuditLog } from "@/services/audit.functions";

export const Route = createFileRoute("/admin/configuracoes/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria — Hr Shoes" }] }),
  loader: async () => {
    return await getAuditLog();
  },
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const res = Route.useLoaderData();

  const entries = Array.isArray(res) ? res : [];

  const actionVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    INSERT: "default",
    UPDATE: "secondary",
    DELETE: "destructive",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log de Auditoria"
        description="Últimas 100 ações realizadas por colaboradores no sistema."
      />

      {entries.length === 0 ? (
        <EmptyState
          title="Nenhum registro de auditoria"
          description="As ações administrativas serão registradas aqui automaticamente."
        />
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(entry.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariant[entry.action] || "secondary"}>
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{entry.table_name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entry.record_id?.slice(0, 8)}…
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Search, ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { listCustomers } from "@/services/crm.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — Hr Shoes" }] }),
  loader: async () => {
    return await listCustomers();
  },
  component: CustomersPage,
});

function CustomersPage() {
  const customers = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Gestão de clientes, histórico de pedidos e CRM." />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar cliente..." className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-center">Pedidos</TableHead>
              <TableHead className="text-right">LTV</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  {new Date(c.joinedAt).toLocaleDateString("pt-BR", {
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-center">{c.orderCount}</TableCell>
                <TableCell className="text-right">{formatMoney(c.ltvCents)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.tags.length > 0 ? (
                      c.tags.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-badge">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                    {c.tags.length > 2 && (
                      <Badge variant="outline" className="text-badge">
                        +{c.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/clientes/$id" params={{ id: c.id }}>
                      Detalhes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

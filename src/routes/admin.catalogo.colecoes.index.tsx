import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

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
import { listCollections } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/colecoes/")({
  head: () => ({ meta: [{ title: "Coleções — Hr Shoes" }] }),
  loader: async () => {
    const res = await listCollections();
    return res.status === "ok" ? res.data : [];
  },
  component: AdminCollectionsPage,
});

function AdminCollectionsPage() {
  const collections = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catálogo"
        title="Coleções"
        description="Agrupe produtos para campanhas, estações ou promoções especiais."
        actions={
          <Button asChild>
            <Link to="/admin/catalogo/colecoes/novo">
              <Plus className="mr-2 size-4" aria-hidden />
              Nova coleção
            </Link>
          </Button>
        }
      />

      {collections.length === 0 ? (
        <EmptyState
          title="Nenhuma coleção cadastrada"
          description="Crie coleções para agrupar produtos para vitrines e campanhas."
          action={
            <Button asChild>
              <Link to="/admin/catalogo/colecoes/novo">Nova coleção</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((col: any) => (
                <TableRow key={col.id}>
                  <TableCell className="font-medium">{col.name}</TableCell>
                  <TableCell className="text-muted-foreground">{col.slug}</TableCell>
                  <TableCell>
                    <Badge variant={col.status === "active" ? "default" : "secondary"}>
                      {col.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
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

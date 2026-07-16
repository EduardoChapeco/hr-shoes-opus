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
import { listCategories } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/categorias/")({
  head: () => ({ meta: [{ title: "Categorias — Hr Shoes" }] }),
  loader: async () => {
    const res = await listCategories();
    return res.status === "ok" ? res.data : [];
  },
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const categories = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catálogo"
        title="Categorias"
        description="Organize seus produtos em categorias hierárquicas."
        actions={
          <Button asChild>
            <Link to="/admin/catalogo/categorias/novo">
              <Plus className="mr-2 size-4" aria-hidden />
              Nova categoria
            </Link>
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria cadastrada"
          description="Crie categorias para organizar seus produtos na vitrine."
          action={
            <Button asChild>
              <Link to="/admin/catalogo/categorias/novo">Nova categoria</Link>
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
              {categories.map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell>
                    <Badge variant={cat.status === "active" ? "default" : "secondary"}>
                      {cat.status === "active" ? "Ativa" : "Inativa"}
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

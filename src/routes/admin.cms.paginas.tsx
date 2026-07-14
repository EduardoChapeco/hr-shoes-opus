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
import { listAdminPages } from "@/services/cms.functions";

export const Route = createFileRoute("/admin/cms/paginas")({
  head: () => ({ meta: [{ title: "Páginas — Hr Shoes" }] }),
  loader: async () => {
    const res = await listAdminPages();
    return res.status === "ok" ? res.data : [];
  },
  component: PagesPage,
});

function PagesPage() {
  const pages = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Páginas"
        description="Gerencie as páginas dinâmicas e o conteúdo institucional da loja."
        actions={
          <Button asChild>
            <Link to="/admin/cms/paginas/novo">
              <Plus className="mr-2 h-4 w-4" />
              Nova página
            </Link>
          </Button>
        }
      />

      {pages.length === 0 ? (
        <EmptyState
          title="Nenhuma página encontrada"
          description="Você ainda não criou nenhuma página no CMS."
          action={
            <Button asChild>
              <Link to="/admin/cms/paginas/novo">Criar página</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page: { id: string; title: string; slug: string; status: string }) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell>/{page.slug}</TableCell>
                  <TableCell>
                    <Badge variant={page.status === "published" ? "default" : "secondary"}>
                      {page.status === "published" ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/admin/cms/paginas/$id/editor" params={{ id: page.id }}>
                        Editar
                      </Link>
                    </Button>
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

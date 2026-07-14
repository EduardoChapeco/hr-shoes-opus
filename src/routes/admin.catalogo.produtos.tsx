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
import { listAdminProducts } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Hr Shoes" }] }),
  loader: async () => {
    const res = await listAdminProducts();
    return res.status === "ok" ? res.data : [];
  },
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const products = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catálogo"
        title="Produtos"
        description="Gerencie seus produtos, preços e variações."
        actions={
          <Button asChild>
            <Link to="/admin/catalogo/produtos/novo">
              <Plus className="mr-2 size-4" aria-hidden />
              Novo produto
            </Link>
          </Button>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto cadastrado"
          description="Crie seu primeiro produto para começar a vender."
          action={
            <Button asChild>
              <Link to="/admin/catalogo/produtos/novo">Novo produto</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(
                (product: {
                  id: string;
                  title: string;
                  slug: string;
                  status: string;
                  price_cents: number;
                  product_types: { name: string }[] | null;
                  product_media: { url: string }[];
                }) => {
                  const cover = product.product_media?.[0]?.url;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {cover ? (
                            <img src={cover} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{product.title}</span>
                            <span className="text-xs text-muted-foreground">{product.slug}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === "published" ? "default" : "secondary"}>
                          {product.status === "published"
                            ? "Publicado"
                            : product.status === "archived"
                              ? "Arquivado"
                              : "Rascunho"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.product_types && product.product_types.length > 0
                          ? product.product_types[0].name
                          : "Genérico"}
                      </TableCell>
                      <TableCell>
                        {(product.price_cents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                },
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

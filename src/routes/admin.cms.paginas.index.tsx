import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, Pencil, ExternalLink, LayoutTemplate, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { listAdminPages, deletePage } from "@/services/cms.functions";

export const Route = createFileRoute("/admin/cms/paginas/")({
  head: () => ({ meta: [{ title: "Páginas CMS — Hr Shoes" }] }),
  loader: async () => {
    const res = await listAdminPages();
    return res.status === "ok" ? res.data : [];
  },
  component: PagesPage,
});

type PageItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
};

function PagesPage() {
  const pages = Route.useLoaderData() as PageItem[];
  const router = useRouter();
  const homePage = pages.find((p) => p.slug === "home");

  const handleDelete = async (pageId: string, pageTitle: string) => {
    if (!confirm(`Deseja realmente excluir a página "${pageTitle}"?`)) return;

    try {
      const res = await deletePage({ data: { id: pageId } });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Página excluída com sucesso!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir página.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CMS & Conteúdo"
        title="Gestão de Páginas"
        description="Gerencie as páginas institucionais e o construtor visual da homepage da vitrine."
        actions={
          <Button asChild size="sm">
            <Link to="/admin/cms/paginas/novo">
              <Plus className="mr-1.5 h-4 w-4" />
              Nova página
            </Link>
          </Button>
        }
      />

      {/* Destaque: Página Inicial */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Página Inicial da Loja (Homepage)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {homePage
                  ? "Edite os blocos visuais de conteúdo que aparecem na homepage da vitrine."
                  : "Crie a página com slug 'home' para editar a homepage da vitrine."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:ml-4">
            {homePage ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a href="/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Ver vitrine
                  </a>
                </Button>
                <Button size="sm" asChild>
                  <Link to={`/admin/cms/paginas/${homePage.id}/editor` as never}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar Construtor Visual
                  </Link>
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link to="/admin/cms/paginas/novo">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Criar Homepage
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {pages.length === 0 ? (
        <EmptyState
          title="Nenhuma página criada"
          description="Crie páginas institucionais para exibir conteúdo dinâmico na vitrine."
          action={
            <Button asChild>
              <Link to="/admin/cms/paginas/novo">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira página
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="grid divide-y">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LayoutTemplate className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {page.title}
                      {page.slug === "home" && (
                        <Badge variant="secondary" className="ml-2 text-[10px] py-0 font-bold">
                          Homepage
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">/{page.slug}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 ml-3">
                  <Badge
                    variant={page.status === "published" ? "default" : "secondary"}
                    className="text-xs px-2 py-0.5"
                  >
                    {page.status === "published" ? "Publicado" : "Rascunho"}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/cms/paginas/${page.id}/editor` as never}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Construtor
                    </Link>
                  </Button>
                  {page.status === "published" && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={page.slug === "home" ? "/" : `/paginas/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  {page.slug !== "home" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(page.id, page.title)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

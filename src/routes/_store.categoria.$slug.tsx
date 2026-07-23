import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, UnconfiguredState } from "@/components/state/states";
import { ProductCard } from "@/components/commerce/product-card";
import { PageHeader } from "@/components/commerce/page-header";
import { listPublishedProducts, listPublishedCategories } from "@/services/catalog.functions";
import type { CategoryDTO, ProductCardDTO } from "@/types/catalog";

export const Route = createFileRoute("/_store/categoria/$slug")({
  loader: async ({ params }) => {
    const [productsResult, categoriesResult] = await Promise.all([
      listPublishedProducts({ data: { categorySlug: params.slug } }),
      listPublishedCategories(),
    ]);
    return { productsResult, categoriesResult, slug: params.slug };
  },
  head: ({ loaderData }) => {
    const data = loaderData as any;
    const categoryName = data?.categoriesResult?.find((c: CategoryDTO) => c.slug === data?.slug)?.name ?? data?.slug ?? "Categoria";
    const title = `${categoryName} — Hr Shoes`;
    const description = `Confira os produtos da categoria ${categoryName} na Hr Shoes. Qualidade, estilo e conforto para o seu dia a dia.`;
    const canonical = typeof window !== "undefined" ? `${window.location.origin}/categoria/${data?.slug}` : "";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        ...(canonical ? [{ property: "og:url", content: canonical }] : []),
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: canonical ? [{ rel: "canonical", href: canonical }] : [],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Início",
                "item": typeof window !== "undefined" ? window.location.origin : ""
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Catálogo",
                "item": typeof window !== "undefined" ? `${window.location.origin}/catalogo` : ""
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": categoryName
              }
            ]
          }),
        },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { productsResult, categoriesResult, slug } = Route.useLoaderData();

  const category: CategoryDTO | undefined = Array.isArray(categoriesResult)
    ? categoriesResult.find((c: CategoryDTO) => c.slug === slug)
    : undefined;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      {/* Breadcrumb */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link to="/" className="hover:text-foreground">
          Início
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <Link to="/catalogo" className="hover:text-foreground">
          Catálogo
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground">{category?.name ?? slug}</span>
      </nav>

      <PageHeader
        eyebrow="Categoria"
        title={category?.name ?? slug}
        description={`Produtos da categoria ${category?.name ?? slug}.`}
      />

      <div className="mt-8">
        {productsResult.length === 0 ? (
          <EmptyState
            title="Nenhum produto nesta categoria"
            description="Ainda não há produtos publicados nesta categoria."
            action={
              <Button asChild>
                <Link to="/catalogo">Ver todos os produtos</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {productsResult.map((product: ProductCardDTO) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronRight, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EmptyState, UnconfiguredState, ErrorState } from "@/components/state/states";
import { ProductCard } from "@/components/commerce/product-card";
import { PageHeader } from "@/components/commerce/page-header";
import { listPublishedProducts } from "@/services/catalog.functions";
import type { ProductListResult } from "@/types/catalog";

const SearchSchema = z.object({
  q: z.string().optional(),
  page: z.number().int().min(1).default(1).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest").optional(),
});

export const Route = createFileRoute("/_store/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo — Hr Shoes" },
      {
        name: "description",
        content: "Explore todos os produtos da Hr Shoes: calçados, roupas e acessórios femininos.",
      },
    ],
  }),
  validateSearch: SearchSchema,
  loader: () => listPublishedProducts(),
  component: CatalogPage,
});

import { ProductGrid } from "@/components/commerce/product-grid";

function CatalogPage() {
  const result = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Vitrine" title="Catálogo" description="Todos os produtos da Hr Shoes." />

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {result.status === "ok" ? `${result.data.length} produto(s)` : null}
        </p>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            aria-label="Ordenar por"
            defaultValue={search.sort ?? "newest"}
            className="min-h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="newest">Mais recentes</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </select>

          {/* Mobile filter sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <SlidersHorizontal className="size-4" aria-hidden />
                Filtrar
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="py-6">
                <p className="text-sm text-muted-foreground text-center">
                  Selecione filtros no topo para refinar os resultados.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Product grid */}
      <div className="mt-6">
        <ProductGrid result={result} />
      </div>
    </div>
  );
}

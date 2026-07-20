import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SlidersHorizontal, X, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { EmptyState, UnconfiguredState, ErrorState } from "@/components/state/states";
import { ProductGrid } from "@/components/commerce/product-grid";
import { PageHeader } from "@/components/commerce/page-header";
import { listPublishedProducts, listPublishedCategories } from "@/services/catalog.functions";
import type { ProductListResult, CategoryDTO } from "@/types/catalog";
import { formatMoney } from "@/lib/money";

// ─── Search schema ────────────────────────────────────────────────────────────
const SearchSchema = z.object({
  sort: z.enum(["newest", "price_asc", "price_desc", "in_stock"]).default("newest").optional(),
  categoria: z.string().optional(),
  minCents: z.number().int().min(0).optional(),
  maxCents: z.number().int().min(0).optional(),
});

type CatalogSearch = z.infer<typeof SearchSchema>;

const SORT_LABELS: Record<string, string> = {
  newest: "Mais recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  in_stock: "Em estoque",
};

const PRICE_RANGES = [
  { label: "Até R$ 100", min: 0, max: 10000 },
  { label: "R$ 100 – R$ 200", min: 10000, max: 20000 },
  { label: "R$ 200 – R$ 400", min: 20000, max: 40000 },
  { label: "Acima de R$ 400", min: 40000, max: undefined },
];

// ─── Route ────────────────────────────────────────────────────────────────────
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
  validateSearch: (search: Record<string, unknown>): CatalogSearch => SearchSchema.parse(search),
  loader: async ({ location }) => {
    const search = location.search as CatalogSearch;
    const [productsRes, categoriesRes] = await Promise.all([
      listPublishedProducts({
        data: {
          categorySlug: search.categoria,
          sort: search.sort ?? "newest",
          minCents: search.minCents,
          maxCents: search.maxCents,
          limit: 24,
        },
      }),
      listPublishedCategories(),
    ]);
    return {
      products: productsRes,
      categories: categoriesRes.status === "ok" ? categoriesRes.data : [],
    };
  },
  component: CatalogPage,
});

// ─── Active filter chips ──────────────────────────────────────────────────────
function FilterChips({
  search,
  categories,
}: {
  search: CatalogSearch;
  categories: CategoryDTO[];
}) {
  const navigate = useNavigate();
  const chips: { label: string; onRemove: () => void }[] = [];

  if (search.categoria) {
    const cat = categories.find((c) => c.slug === search.categoria);
    chips.push({
      label: cat?.name ?? search.categoria,
      onRemove: () => navigate({ to: Route.fullPath, search: (s) => ({ ...s, categoria: undefined }) }),
    });
  }
  if (search.sort && search.sort !== "newest") {
    chips.push({
      label: SORT_LABELS[search.sort],
      onRemove: () => navigate({ to: Route.fullPath, search: (s) => ({ ...s, sort: undefined }) }),
    });
  }
  if (search.minCents != null || search.maxCents != null) {
    const range = PRICE_RANGES.find(
      (r) => r.min === search.minCents && r.max === search.maxCents,
    );
    chips.push({
      label: range?.label ?? `Faixa de preço`,
      onRemove: () =>
        navigate({ to: Route.fullPath, search: (s) => ({ ...s, minCents: undefined, maxCents: undefined }) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Filtros ativos:</span>
      {chips.map((chip) => (
        <Badge
          key={chip.label}
          variant="secondary"
          className="gap-1.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
          onClick={chip.onRemove}
        >
          {chip.label}
          <X className="size-3" aria-hidden />
        </Badge>
      ))}
      <button
        onClick={() =>
          navigate({ to: Route.fullPath, search: {},
          })
        }
        className="text-xs text-muted-foreground underline hover:text-foreground"
      >
        Limpar todos
      </button>
    </div>
  );
}

// ─── Filter panel (used in both sidebar desktop + sheet mobile) ───────────────
function FilterPanel({
  categories,
  search,
  onClose,
}: {
  categories: CategoryDTO[];
  search: CatalogSearch;
  onClose?: () => void;
}) {
  const navigate = useNavigate();

  const applyFilter = (patch: Partial<CatalogSearch>) => {
    navigate({ to: Route.fullPath, search: (s) => ({ ...s, ...patch }) });
    onClose?.();
  };

  return (
    <div className="space-y-6">
      {/* Ordenar */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Ordenar por
        </p>
        <div className="space-y-1">
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => applyFilter({ sort: value as CatalogSearch["sort"] })}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                (search.sort ?? "newest") === value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Categorias */}
      {categories.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Categoria
          </p>
          <div className="space-y-1">
            <button
              onClick={() => applyFilter({ categoria: undefined })}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                !search.categoria
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              Todas as categorias
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => applyFilter({ categoria: cat.slug })}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  search.categoria === cat.slug
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                {cat.name}
                <ChevronRight className="size-3.5 opacity-50" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Faixa de Preço */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Faixa de preço
        </p>
        <div className="space-y-1">
          <button
            onClick={() => applyFilter({ minCents: undefined, maxCents: undefined })}
            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
              search.minCents == null && search.maxCents == null
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-accent text-foreground"
            }`}
          >
            Qualquer preço
          </button>
          {PRICE_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => applyFilter({ minCents: range.min, maxCents: range.max })}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                search.minCents === range.min && search.maxCents === range.max
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function CatalogPage() {
  const { products: result, categories } = Route.useLoaderData() as {
    products: ProductListResult;
    categories: CategoryDTO[];
  };
  const search = Route.useSearch();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const navigate = useNavigate();

  const activeFiltersCount = [
    search.categoria,
    search.sort && search.sort !== "newest" ? search.sort : null,
    search.minCents != null ? "price" : null,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground">Catálogo</span>
      </nav>

      <PageHeader
        eyebrow="Vitrine"
        title={search.categoria
          ? (categories.find((c) => c.slug === search.categoria)?.name ?? "Catálogo")
          : "Catálogo"}
        description="Todos os produtos da Hr Shoes."
      />

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {result.status === "ok" ? `${result.data.length} produto(s)` : null}
          </p>
          <FilterChips search={search} categories={categories} />
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop sort (quick) */}
          <div className="hidden md:flex items-center gap-2">
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <button
                key={value}
                id={`sort-${value}`}
                onClick={() =>
                  navigate({ to: Route.fullPath, search: (s) => ({ ...s, sort: value as CatalogSearch["sort"] }) })
                }
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  (search.sort ?? "newest") === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mobile filter sheet */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative gap-1.5" id="btn-filtrar">
                <SlidersHorizontal className="size-4" aria-hidden />
                Filtrar
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle>Filtros e Ordenação</SheetTitle>
              </SheetHeader>
              <FilterPanel
                categories={categories}
                search={search}
                onClose={() => setFilterSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main layout: sidebar (desktop) + grid */}
      <div className="mt-8 flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
            <FilterPanel categories={categories} search={search} />
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {result.status === "error" && <ErrorState description={result.message} />}
          {result.status === "unconfigured" && <ErrorState description={result.description} />}
          {result.status === "empty" && (
            <EmptyState
              title="Nenhum produto encontrado"
              description={
                activeFiltersCount > 0
                  ? "Tente remover alguns filtros para ver mais produtos."
                  : "Ainda não há produtos neste catálogo."
              }
              action={
                activeFiltersCount > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: Route.fullPath, search: {} })}
                  >
                    Limpar filtros
                  </Button>
                ) : undefined
              }
            />
          )}
          {result.status === "ok" && <ProductGrid result={result} />}
        </div>
      </div>
    </div>
  );
}

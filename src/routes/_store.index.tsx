import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ShoppingBag, ChevronRight, ImageOff, PlugZap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState, UnconfiguredState, ErrorState } from "@/components/state/states";
import { ProductCard } from "@/components/commerce/product-card";
import {
  listPublishedProducts,
  listPublishedCategories,
  getStoreConfig,
} from "@/services/catalog.functions";
import type { StoreConfigDTO, ProductCardDTO, CategoryDTO } from "@/types/catalog";

export const Route = createFileRoute("/_store/")({
  head: () => ({
    meta: [
      { title: "Hr Shoes — Conforto e Estilo" },
      {
        name: "description",
        content:
          "Loja online da Hr Shoes: moda feminina contemporânea com conforto e estilo. Calçados, roupas e acessórios.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Hr Shoes — Conforto e Estilo" },
    ],
  }),
  loader: async () => {
    const [storeConfig, products, categories] = await Promise.all([
      getStoreConfig(),
      listPublishedProducts(),
      listPublishedCategories(),
    ]);
    return { storeConfig, products, categories };
  },
  component: Home,
});

// ---------------------------------------------------------------------------
// Announcement Bar
// ---------------------------------------------------------------------------

function AnnouncementBar({ config }: { config: StoreConfigDTO }) {
  const active = config.announcements.filter((a) => a.isActive);
  if (active.length === 0) return null;
  const item = active[0]!;
  return (
    <div className="bg-primary py-2 text-center text-xs font-medium text-primary-foreground">
      {item.link ? (
        <a href={item.link} className="underline-offset-2 hover:underline">
          {item.text}
        </a>
      ) : (
        <span>{item.text}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero Banner
// ---------------------------------------------------------------------------

function HeroBanner({ config }: { config: StoreConfigDTO }) {
  const banner = config.heroBanners[0] ?? null;

  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="mx-auto max-w-screen-xl px-4 py-10 md:px-6 md:py-16">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
          {/* Text */}
          <div>
            {banner?.headline ? (
              <h1 className="text-editorial text-4xl text-foreground sm:text-5xl lg:text-6xl">
                {banner.headline}
              </h1>
            ) : (
              <h1 className="text-editorial text-4xl text-foreground sm:text-5xl lg:text-6xl">
                {config.name}
              </h1>
            )}
            {banner?.subheadline && (
              <p className="mt-4 max-w-md text-base text-muted-foreground">{banner.subheadline}</p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              {banner?.ctaLink && banner.ctaLabel ? (
                <Button size="lg" asChild>
                  <a href={banner.ctaLink}>
                    {banner.ctaLabel}
                    <ChevronRight className="size-4" aria-hidden />
                  </a>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link to="/catalogo">
                    Ver catálogo
                    <ShoppingBag className="size-4" aria-hidden />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild>
                <Link to="/buscar">
                  <Search className="size-4" aria-hidden />
                  Buscar produtos
                </Link>
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="order-first md:order-last">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted">
              {banner?.imageUrl ? (
                <img
                  src={banner.imageUrl}
                  alt={banner.imageAlt ?? config.name}
                  loading="eager"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <ImageOff className="size-10" aria-hidden />
                  <p className="text-xs">Adicione um banner no painel de administração</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Category Navigation Rail
// ---------------------------------------------------------------------------

function CategoryRail({ categories }: { categories: CategoryDTO[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-screen-xl px-4 md:px-6">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to="/categoria/$slug"
            params={{ slug: cat.slug }}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {cat.coverUrl && (
              <img
                src={cat.coverUrl}
                alt=""
                aria-hidden
                loading="lazy"
                className="size-5 rounded-full object-cover"
              />
            )}
            {cat.name}
          </Link>
        ))}
        <Link
          to="/catalogo"
          className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver tudo
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Product Rail (Horizontal scroll)
// ---------------------------------------------------------------------------

function ProductRailSection({
  title,
  eyebrow,
  products,
  viewAllTo,
}: {
  title: string;
  eyebrow?: string;
  products: ProductCardDTO[];
  viewAllTo?: string;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-screen-xl px-4 md:px-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          {eyebrow && <p className="eyebrow text-primary">{eyebrow}</p>}
          <h2 className="text-editorial mt-1 text-2xl text-foreground sm:text-3xl">{title}</h2>
        </div>
        {viewAllTo && (
          <Button variant="ghost" size="sm" asChild>
            <Link to={viewAllTo as never}>
              Ver tudo
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Benefits Bar
// ---------------------------------------------------------------------------

const BENEFIT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // Lazy dynamic icon resolution isn't possible with Lucide at build time.
  // Icons are referenced by name from the server config; we map them here.
  // Add more mappings as needed — never hardcode benefit content here.
};

function BenefitsSection({ config }: { config: StoreConfigDTO }) {
  if (config.benefits.length === 0) return null;
  return (
    <section className="bg-card py-8">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {config.benefits.map((benefit) => (
            <div key={benefit.id} className="flex flex-col items-start gap-2 p-4">
              <span className="text-2xl" aria-hidden>
                {/* Icon name from server: render as emoji/text fallback until
                    Phase 3 when we add full icon resolution via the CMS registry */}
                ✓
              </span>
              <h3 className="text-sm font-semibold text-foreground">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Unconfigured storefront shell (when Supabase not set up yet)
// ---------------------------------------------------------------------------

function UnconfiguredStorefront() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-20 text-center md:px-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 inline-flex size-16 items-center justify-center rounded-full bg-accent">
          <PlugZap className="size-8 text-accent-foreground" aria-hidden />
        </div>
        <h1 className="text-editorial text-3xl text-foreground">Loja em configuração</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          A loja está sendo configurada. Acesse o painel de administração para criar sua loja,
          adicionar produtos e publicar conteúdo.
        </p>
        <Button className="mt-8" asChild>
          <Link to="/admin">Ir para o painel</Link>
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home Page Component
// ---------------------------------------------------------------------------

function Home() {
  const { storeConfig, products, categories } = Route.useLoaderData();

  // If store is not configured at all, show a graceful non-fake empty shell.
  if (storeConfig.status === "unconfigured") {
    return <UnconfiguredStorefront />;
  }

  if (storeConfig.status === "error") {
    return (
      <div className="p-8">
        <ErrorState description={storeConfig.message} />
      </div>
    );
  }

  if (storeConfig.status === "empty") {
    return (
      <div className="p-8">
        <ErrorState description="Loja sem configuração" />
      </div>
    );
  }

  const config = storeConfig.data;

  const publishedProducts = products.status === "ok" ? products.data : [];

  const publishedCategories = categories.status === "ok" ? categories.data : [];

  return (
    <div className="flex flex-col gap-10 pb-12">
      {/* 1. Announcement Bar */}
      <AnnouncementBar config={config} />

      {/* 2. Hero Banner */}
      <HeroBanner config={config} />

      {/* 3. Category Navigation */}
      {publishedCategories.length > 0 && <CategoryRail categories={publishedCategories} />}

      {/* 4. Products — Novidades */}
      {publishedProducts.length > 0 ? (
        <ProductRailSection
          eyebrow="Vitrine"
          title="Novidades"
          products={publishedProducts.slice(0, 8)}
          viewAllTo="/catalogo"
        />
      ) : (
        <section className="mx-auto max-w-screen-xl px-4 md:px-6">
          <EmptyState
            title="Ainda não há produtos publicados"
            description="Assim que a loja publicar os primeiros produtos, eles aparecerão aqui automaticamente."
          />
        </section>
      )}

      {/* 5. Benefits */}
      <BenefitsSection config={config} />
    </div>
  );
}

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

import { getPublicPageBySlug } from "@/services/cms.functions";

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
    const [storeConfig, products, categories, homePageRes] = await Promise.all([
      getStoreConfig(),
      listPublishedProducts(),
      listPublishedCategories(),
      getPublicPageBySlug({ data: { slug: "home" } }),
    ]);
    return {
      storeConfig,
      products,
      categories,
      homePage: homePageRes.status === "ok" ? homePageRes.data : null,
    };
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
// CMS Dynamic Blocks
// ---------------------------------------------------------------------------

function DynamicHero({ content }: { content: Record<string, unknown> }) {
  const title = String(content.title || "");
  const subtitle = String(content.subtitle || "");
  const bg_url = String(content.image_url || content.bg_url || "");
  const button_text = String(content.button_text || "");
  const button_link = String(content.button_link || "");

  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="mx-auto max-w-screen-xl px-4 py-10 md:px-6 md:py-16">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
          <div>
            {title && (
              <h1 className="text-editorial text-4xl text-foreground sm:text-5xl lg:text-6xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-4 max-w-md text-base text-muted-foreground">{subtitle}</p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              {button_link && button_text ? (
                <Button size="lg" asChild>
                  <Link to={button_link as never}>
                    {button_text}
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link to="/catalogo">
                    Ver catálogo
                    <ShoppingBag className="size-4" aria-hidden />
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <div className="order-first md:order-last">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted">
              {bg_url ? (
                <img src={bg_url} alt="" loading="eager" className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <ImageOff className="size-10" aria-hidden />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DynamicRichText({ content }: { content: Record<string, unknown> }) {
  const text = String(content.content || content.text || "");
  return (
    <section className="mx-auto max-w-screen-xl px-4 md:px-6 py-8">
      <div className="prose dark:prose-invert max-w-3xl mx-auto text-center">
        <p className="text-lg text-muted-foreground">{text}</p>
      </div>
    </section>
  );
}

function DynamicFeaturedProducts({
  content,
  publishedProducts,
}: {
  content: Record<string, unknown>;
  publishedProducts: ProductCardDTO[];
}) {
  const title = String(content.title || "Destaques");
  if (publishedProducts.length === 0) return null;

  return (
    <section className="mx-auto max-w-screen-xl px-4 md:px-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-editorial mt-1 text-2xl text-foreground sm:text-3xl">{title}</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/catalogo">
            Ver tudo
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {publishedProducts.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
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
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
          className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver tudo
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Benefits Bar
// ---------------------------------------------------------------------------

function BenefitsSection({ config }: { config: StoreConfigDTO }) {
  if (config.benefits.length === 0) return null;
  return (
    <section className="bg-card py-8">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {config.benefits.map((benefit) => (
            <div key={benefit.id} className="flex flex-col items-start gap-2 p-4">
              <span className="text-2xl" aria-hidden>
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

function Home() {
  const { storeConfig, products, categories, homePage } = Route.useLoaderData();

  if (storeConfig.status === "unconfigured") return <UnconfiguredStorefront />;
  if (storeConfig.status === "error")
    return (
      <div className="p-8">
        <ErrorState description={storeConfig.message} />
      </div>
    );
  if (storeConfig.status === "empty")
    return (
      <div className="p-8">
        <ErrorState description="Loja sem configuração" />
      </div>
    );

  const config = storeConfig.data;
  const publishedProducts = products.status === "ok" ? products.data : [];
  const publishedCategories = categories.status === "ok" ? categories.data : [];

  // Fallback to static render if no dynamic page is published
  if (!homePage || homePage.sections.length === 0) {
    return (
      <div className="flex flex-col gap-10 pb-12">
        <AnnouncementBar config={config} />

        {/* Fallback to config hero if no sections */}
        {config.heroBanners[0] && (
          <DynamicHero
            content={{
              title: config.heroBanners[0].headline,
              subtitle: config.heroBanners[0].subheadline,
              image_url: config.heroBanners[0].imageUrl,
              button_text: config.heroBanners[0].ctaLabel,
              button_link: config.heroBanners[0].ctaLink,
            }}
          />
        )}

        {publishedCategories.length > 0 && <CategoryRail categories={publishedCategories} />}

        {publishedProducts.length > 0 && (
          <DynamicFeaturedProducts
            content={{ title: "Novidades" }}
            publishedProducts={publishedProducts}
          />
        )}

        <BenefitsSection config={config} />
      </div>
    );
  }

  // Dynamic Render based on CMS Block Registry
  return (
    <div className="flex flex-col gap-10 pb-12">
      <AnnouncementBar config={config} />

      {/* 
        This is where we actually render the dynamic blocks from the CMS Registry!
        Each section from Supabase Maps to its corresponding React Component.
      */}
      {homePage.sections.map((section: any) => {
        switch (section.section_type) {
          case "hero":
            return <DynamicHero key={section.id} content={section.content} />;
          case "rich_text":
          case "text":
            return <DynamicRichText key={section.id} content={section.content} />;
          case "featured_products":
          case "product_grid":
            return (
              <DynamicFeaturedProducts
                key={section.id}
                content={section.content}
                publishedProducts={publishedProducts}
              />
            );
          default:
            return null;
        }
      })}

      <BenefitsSection config={config} />
    </div>
  );
}

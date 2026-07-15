import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ShoppingBag, ChevronRight, ImageOff, PlugZap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState, UnconfiguredState, ErrorState } from "@/components/state/states";
import { ProductCard } from "@/components/commerce/product-card";
import {
  listPublishedProducts,
  listPublishedCategories,
  getStoreConfig,
  getProductsByCollection,
} from "@/services/catalog.functions";
import type { StoreConfigDTO, ProductCardDTO, CategoryDTO } from "@/types/catalog";

import { getPublicPageBySlug } from "@/services/cms.functions";
import { HeroCarousel } from "@/components/commerce/dynamic-sections/hero-carousel";
import { AnnouncementBar as CMSAnnouncementBar } from "@/components/commerce/dynamic-sections/announcement-bar";
import { ProductRail } from "@/components/commerce/dynamic-sections/product-rail";
import { MosaicBanners } from "@/components/commerce/dynamic-sections/mosaic-banners";
import { RichText } from "@/components/commerce/dynamic-sections/rich-text";

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
    const homePage = homePageRes.status === "ok" ? homePageRes.data : null;
    const collectionsData: Record<string, ProductCardDTO[]> = {};

    if (homePage && homePage.sections) {
      const fetchPromises = [];
      for (const section of homePage.sections) {
        if (
          (section.section_type === "featured_products" || section.section_type === "product_grid") &&
          section.content.collection_slug
        ) {
          const slug = String(section.content.collection_slug);
          if (!collectionsData[slug]) {
            collectionsData[slug] = []; // initialize to prevent duplicate fetches
            fetchPromises.push(
              getProductsByCollection({ data: { slug } }).then((res) => {
                collectionsData[slug] = res.status === "ok" ? res.data : [];
              })
            );
          }
        }
      }
      if (fetchPromises.length > 0) {
        await Promise.all(fetchPromises);
      }
    }

    return {
      storeConfig,
      products,
      categories,
      homePage,
      collectionsData,
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
  const { storeConfig, products, categories, homePage, collectionsData } = Route.useLoaderData();

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
          <HeroCarousel
            content={{
              banners: [{
                title: config.heroBanners[0].headline,
                image_url: config.heroBanners[0].imageUrl,
                button_text: config.heroBanners[0].ctaLabel,
                link: config.heroBanners[0].ctaLink,
              }]
            }}
          />
        )}

        {publishedCategories.length > 0 && <CategoryRail categories={publishedCategories} />}

        {publishedProducts.length > 0 && (
          <ProductRail
            content={{ title: "Novidades" }}
            publishedProducts={publishedProducts}
            collectionsData={collectionsData}
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
          case "hero_carousel":
            return <HeroCarousel key={section.id} content={section.content} />;
          case "rich_text":
          case "text":
            return <RichText key={section.id} content={section.content} />;
          case "featured_products":
          case "product_grid":
          case "product_rail":
            return (
              <ProductRail
                key={section.id}
                content={section.content}
                publishedProducts={publishedProducts}
                collectionsData={collectionsData}
              />
            );
          case "announcement_bar":
            return <CMSAnnouncementBar key={section.id} content={section.content} />;
          case "mosaic_banners":
            return <MosaicBanners key={section.id} content={section.content} />;
          default:
            return null;
        }
      })}

      <BenefitsSection config={config} />
    </div>
  );
}

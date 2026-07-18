import { createFileRoute, notFound } from "@tanstack/react-router";

import { getPublicPageBySlug } from "@/services/cms.functions";
import { AnnouncementBar as CMSAnnouncementBar } from "@/components/commerce/dynamic-sections/announcement-bar";
import { HeroCarousel } from "@/components/commerce/dynamic-sections/hero-carousel";
import { MosaicBanners } from "@/components/commerce/dynamic-sections/mosaic-banners";
import { ProductRail } from "@/components/commerce/dynamic-sections/product-rail";
import { RichText } from "@/components/commerce/dynamic-sections/rich-text";
import { BentoGrid } from "@/components/commerce/dynamic-sections/bento-grid";
import { GalleryGrid } from "@/components/commerce/dynamic-sections/gallery-grid";
import { InfoCards } from "@/components/commerce/dynamic-sections/info-cards";
import { SocialGrid } from "@/components/commerce/dynamic-sections/social-grid";
import { ContactForm } from "@/components/commerce/dynamic-sections/contact-form";
import { VideoSection } from "@/components/commerce/dynamic-sections/video-section";
import { listPublishedProducts, getProductsByCollection } from "@/services/catalog.functions";
import type { ProductCardDTO } from "@/types/catalog";

export const Route = createFileRoute("/_store/paginas/$slug")({
  loader: async ({ params }) => {
    const res = await getPublicPageBySlug({ data: { slug: params.slug } });
    if (res.status === "not_found") throw notFound();
    if (res.status === "error" || res.status === "unconfigured") throw new Error(res.status);

    const page = res.data;
    const collectionsData: Record<string, ProductCardDTO[]> = {};
    const [productsRes] = await Promise.all([
      listPublishedProducts().catch(() => ({ status: "error" as const, data: [] })),
    ]);
    const publishedProducts = productsRes.status === "ok" ? productsRes.data : [];

    if (page && page.sections) {
      const fetchPromises = [];
      for (const section of page.sections) {
        if (
          (section.section_type === "featured_products" ||
            section.section_type === "product_grid" ||
            section.section_type === "product_rail") &&
          section.content.collection_slug
        ) {
          const slug = String(section.content.collection_slug);
          if (!collectionsData[slug]) {
            collectionsData[slug] = [];
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
      page,
      publishedProducts,
      collectionsData,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData || !loaderData.page) return { meta: [{ title: "Página não encontrada" }] };
    return {
      meta: [
        { title: loaderData.page.seo_title || `${loaderData.page.title} — Hr Shoes` },
        { name: "description", content: loaderData.page.seo_description || "" },
      ],
    };
  },
  component: PublicPage,
});

function PublicPage() {
  const { page, publishedProducts, collectionsData } = Route.useLoaderData() as any;

  if (!page) return null;

  return (
    <main className="w-full flex flex-col gap-10 pb-12">
      {page.sections.map((section: any) => {
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
          case "bento_grid":
            return <BentoGrid key={section.id} content={section.content as any} />;
          case "gallery_grid":
            return <GalleryGrid key={section.id} content={section.content as any} />;
          case "info_cards":
            return <InfoCards key={section.id} content={section.content as any} />;
          case "social_grid":
            return <SocialGrid key={section.id} content={section.content as any} />;
          case "contact_form":
            return <ContactForm key={section.id} storeId={page.store_id} content={section.content as any} />;
          case "video_section":
            return <VideoSection key={section.id} content={section.content as any} />;
          default:
            return null;
        }
      })}
    </main>
  );
}

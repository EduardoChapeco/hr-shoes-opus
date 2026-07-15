/**
 * Catalog server functions — Hr Shoes Commerce (BFF boundary)
 *
 * ALL data access to Supabase happens here, inside createServerFn().
 * Components receive DTOs, never raw Supabase rows.
 * Commercial calculations (price, stock) happen here — never in the client.
 *
 * If Supabase is not configured, returns `{ status: "unconfigured" }`.
 * If the store has no data, returns `{ status: "empty" }`.
 * Never returns fabricated/mock data.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAnonServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import type {
  ProductListResult,
  ProductCardDTO,
  CategoryListResult,
  CategoryDTO,
  StoreConfigResult,
  StoreConfigDTO,
  AnnouncementDTO,
  BenefitDTO,
  HeroBannerDTO,
} from "@/types/catalog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the default store_id from the store config table (single-tenant for now). */
async function resolveDefaultStoreId(): Promise<string | null> {
  const db = getAnonServerClient();
  const { data, error } = await db
    .from("stores")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.id as string;
}

// ---------------------------------------------------------------------------
// listPublishedProducts
// ---------------------------------------------------------------------------

export const listPublishedProducts = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        limit: z.number().int().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
        categorySlug: z.string().optional(),
      })
      .default({}),
  )
  .handler(async ({ data: params }): Promise<ProductListResult> => {
    try {
      const db = getAnonServerClient();
      const storeId = await resolveDefaultStoreId();

      if (!storeId) {
        return {
          status: "unconfigured",
          reason: "Nenhuma loja foi configurada. Configure a loja no painel de administração.",
        };
      }

      const selectQuery = params.categorySlug
        ? `id, slug, title, brand, price_cents, compare_at_cents,
           product_media(url, alt, sort_order),
           product_categories!inner(categories!inner(slug))`
        : `id, slug, title, brand, price_cents, compare_at_cents,
           product_media(url, alt, sort_order)`;

      let query = db
        .from("products")
        .select(selectQuery)
        .eq("store_id", storeId)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(params.limit);

      if (params.categorySlug) {
        query = query.eq("product_categories.categories.slug", params.categorySlug);
      }

      if (params.cursor) {
        query = query.lt("id", params.cursor);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[catalog.functions] listPublishedProducts:", error.message);
        return { status: "error", message: "Não foi possível carregar os produtos." };
      }

      if (!data || data.length === 0) {
        return { status: "empty" };
      }

      const products: ProductCardDTO[] = data.map((row) => {
        // Pick the first media item sorted by sort_order (cover image)
        const media = Array.isArray(row.product_media)
          ? [...row.product_media].sort((a, b) => a.sort_order - b.sort_order)
          : [];
        const cover = media[0] ?? null;

        return {
          id: row.id as string,
          slug: row.slug as string,
          title: row.title as string,
          brand: (row.brand as string | null) ?? null,
          priceCents: row.price_cents as number,
          compareAtCents: (row.compare_at_cents as number | null) ?? null,
          coverUrl: cover?.url ?? null,
          coverAlt: cover?.alt ?? null,
        };
      });

      return { status: "ok", data: products };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) {
        return {
          status: "unconfigured",
          reason: "Nossa vitrine está passando por uma rápida atualização técnica.",
        };
      }
      console.error("[catalog.functions] unexpected error:", e);
      return { status: "error", message: "Erro inesperado ao carregar produtos." };
    }
  });

// ---------------------------------------------------------------------------
// listPublishedCategories
// ---------------------------------------------------------------------------

export const listPublishedCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryListResult> => {
    try {
      const db = getAnonServerClient();
      const storeId = await resolveDefaultStoreId();

      if (!storeId) {
        return {
          status: "unconfigured",
          reason: "Nenhuma loja foi configurada.",
        };
      }

      const { data, error } = await db
        .from("categories")
        .select("id, slug, name, cover_url")
        .eq("store_id", storeId)
        .eq("status", "active")
        .is("parent_id", null) // top-level only for nav
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("[catalog.functions] listPublishedCategories:", error.message);
        return { status: "error", message: "Não foi possível carregar as categorias." };
      }

      if (!data || data.length === 0) {
        return { status: "empty" };
      }

      const categories: CategoryDTO[] = data.map((row) => ({
        id: row.id as string,
        slug: row.slug as string,
        name: row.name as string,
        coverUrl: (row.cover_url as string | null) ?? null,
      }));

      return { status: "ok", data: categories };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) {
        return {
          status: "unconfigured",
          reason: "Nossas categorias de calçados estão em manutenção temporária.",
        };
      }
      return { status: "error", message: "Erro inesperado ao carregar categorias." };
    }
  },
);

// ---------------------------------------------------------------------------
// getStoreConfig
// ---------------------------------------------------------------------------

export const getStoreConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreConfigResult> => {
    try {
      const db = getAnonServerClient();

      const { data, error } = await db
        .from("stores")
        .select("id, name, settings")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error || !data) {
        return {
          status: "unconfigured",
          reason: "Nenhuma loja configurada. Crie a loja no painel de administração.",
        };
      }

      // settings is a JSONB column — validated here (not trusted as-is).
      const settings = (data.settings ?? {}) as Record<string, unknown>;

      const announcements: AnnouncementDTO[] = Array.isArray(settings.announcements)
        ? (settings.announcements as AnnouncementDTO[]).filter(
            (a) => a && typeof a.text === "string" && a.isActive,
          )
        : [];

      const heroBanners: HeroBannerDTO[] = Array.isArray(settings.heroBanners)
        ? (settings.heroBanners as HeroBannerDTO[])
        : [];

      const benefits: BenefitDTO[] = Array.isArray(settings.benefits)
        ? (settings.benefits as BenefitDTO[])
        : [];

      const config: StoreConfigDTO = {
        storeId: data.id as string,
        name: data.name as string,
        logoUrl: typeof settings.logoUrl === "string" ? settings.logoUrl : null,
        announcements,
        heroBanners,
        benefits,
        contactPhone: typeof settings.contactPhone === "string" ? settings.contactPhone : null,
        contactEmail: typeof settings.contactEmail === "string" ? settings.contactEmail : null,
        contactAddress:
          typeof settings.contactAddress === "string" ? settings.contactAddress : null,
        businessHours: typeof settings.businessHours === "string" ? settings.businessHours : null,
        instagramHandle:
          typeof settings.instagramHandle === "string" ? settings.instagramHandle : null,
      };

      return { status: "ok", data: config };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) {
        return {
          status: "unconfigured",
          reason: "As configurações e dados da loja estão sendo restabelecidos.",
        };
      }
      return { status: "error", message: "Erro inesperado ao carregar configurações da loja." };
    }
  },
);
export const searchProducts = createServerFn({ method: "GET" })
  .validator(z.object({ query: z.string().min(1) }))
  .handler(async ({ data: { query } }): Promise<ProductListResult> => {
    try {
      const db = await getAnonServerClient();
      const { data: store } = await db.from("stores").select("id").limit(1).single();

      if (!store) {
        return { status: "unconfigured", reason: "Loja não encontrada." };
      }

      const { data, error } = await db
        .from("products")
        .select(
          `
          id,
          title,
          slug,
          status,
          priceCents:price_cents,
          compareAtCents:compare_at_price_cents,
          media:product_media(id, url, alt, sort_order)
        `,
        )
        .eq("store_id", store.id)
        .eq("status", "published")
        .ilike("name", `%${query}%`)
        .order("created_at", { ascending: false });

      if (error) {
        return { status: "error", message: error.message };
      }

      if (!data || data.length === 0) {
        return { status: "ok", data: [] };
      }

      // Map to DTO
      const mapped: ProductCardDTO[] = data.map((item: any) => {
        const sortedMedia = item.media.sort(
          (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0),
        );
        return {
          id: item.id,
          title: item.title,
          slug: item.slug,
          priceCents: item.priceCents,
          compareAtCents: item.compareAtCents,
          coverImage: sortedMedia[0]
            ? {
                url: sortedMedia[0].url,
                alt: sortedMedia[0].alt,
              }
            : null,
          hoverImage: sortedMedia[1]
            ? {
                url: sortedMedia[1].url,
                alt: sortedMedia[1].alt,
              }
            : null,
        };
      });

      return { status: "ok", data: mapped };
    } catch (e: any) {
      return { status: "error", message: e.message || "Erro desconhecido" };
    }
  });

export const getProductsByCollection = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }): Promise<ProductListResult> => {
    try {
      const db = await getAnonServerClient();
      const { data: store } = await db.from("stores").select("id").limit(1).single();

      if (!store) {
        return { status: "unconfigured", reason: "Loja não encontrada." };
      }

      // First get collection id
      const { data: collection, error: collError } = await db
        .from("collections")
        .select("id")
        .eq("store_id", store.id)
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (collError || !collection) {
        return { status: "empty" };
      }

      // Get product_ids from product_collections junction
      const { data: productIdsData } = await db
        .from("product_collections")
        .select("product_id")
        .eq("collection_id", collection.id);

      const productIds = productIdsData?.map((row) => row.product_id) || [];
      if (productIds.length === 0) return { status: "empty" };

      const { data, error } = await db
        .from("products")
        .select(
          `id, slug, title, brand, priceCents:price_cents, compareAtCents:compare_at_price_cents, status, media:product_media(url, alt, sort_order)`,
        )
        .eq("store_id", store.id)
        .eq("status", "published")
        .in("id", productIds)
        .order("created_at", { ascending: false });

      if (error) return { status: "error", message: error.message };
      if (!data || data.length === 0) return { status: "empty" };

      const mapped: ProductCardDTO[] = data.map((item: any) => {
        const sortedMedia =
          item.media?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) || [];
        return {
          id: item.id,
          title: item.title,
          slug: item.slug,
          brand: item.brand,
          priceCents: item.priceCents,
          compareAtCents: item.compareAtCents,
          coverUrl: sortedMedia[0]?.url || null,
          coverAlt: sortedMedia[0]?.alt || null,
        };
      });

      return { status: "ok", data: mapped };
    } catch (e: any) {
      return { status: "error", message: e.message || "Erro desconhecido" };
    }
  });

export const getPromotionalProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductListResult> => {
    try {
      const db = await getAnonServerClient();
      const { data: store } = await db.from("stores").select("id").limit(1).single();

      if (!store) {
        return { status: "unconfigured", reason: "Loja não encontrada." };
      }

      const { data, error } = await db
        .from("products")
        .select(
          `id, slug, title, brand, priceCents:price_cents, compareAtCents:compare_at_price_cents, status, media:product_media(url, alt, sort_order)`,
        )
        .eq("store_id", store.id)
        .eq("status", "published")
        .gt("compare_at_price_cents", 0)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) return { status: "error", message: error.message };
      if (!data || data.length === 0) return { status: "empty" };

      // Filter natively to ensure only actual discounts are returned (compare > price)
      const discountedData = data.filter(
        (item) => item.compareAtCents && item.compareAtCents > item.priceCents,
      );
      if (discountedData.length === 0) return { status: "empty" };

      const mapped: ProductCardDTO[] = discountedData.map((item: any) => {
        const sortedMedia =
          item.media?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) || [];
        return {
          id: item.id,
          title: item.title,
          slug: item.slug,
          brand: item.brand,
          priceCents: item.priceCents,
          compareAtCents: item.compareAtCents,
          coverUrl: sortedMedia[0]?.url || null,
          coverAlt: sortedMedia[0]?.alt || null,
        };
      });

      return { status: "ok", data: mapped };
    } catch (e: any) {
      return { status: "error", message: e.message || "Erro desconhecido" };
    }
  },
);

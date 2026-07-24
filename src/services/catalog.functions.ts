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

import { getAnonServerClient, getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
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
  CatalogResult,
} from "@/types/catalog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { resolveTenantStoreId } from "@/lib/tenant";

/** 
 * Helper to map Supabase joined row into ProductCardDTO, 
 * applying business rules for out-of-stock and effective price.
 */
function mapProductCardDTO(row: any): ProductCardDTO {
  const mediaList = Array.isArray(row.product_media || row.media)
    ? [...(row.product_media || row.media)].sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const cover = mediaList[0] ?? null;

  const basePrice = row.price_cents ?? row.priceCents;
  const compareAt = row.compare_at_cents ?? row.compareAtCents ?? null;

  const variants = Array.isArray(row.product_variants || row.variants)
    ? (row.product_variants || row.variants)
    : [];
  
  const activeVariants = variants.filter((v: any) => v.status === "active");
  
  let isOutOfStock = true;
  let displayPrice = basePrice;

  if (activeVariants.length > 0) {
    const totalAvailable = activeVariants.reduce(
      (sum: number, v: any) => sum + Math.max(0, (v.stock_on_hand || 0) - (v.stock_reserved || 0)),
      0
    );
    isOutOfStock = totalAvailable <= 0;

    const variantsForPrice = totalAvailable > 0 
      ? activeVariants.filter((v: any) => Math.max(0, (v.stock_on_hand || 0) - (v.stock_reserved || 0)) > 0) 
      : activeVariants;
    
    if (variantsForPrice.length > 0) {
      const minPrice = Math.min(...variantsForPrice.map((v: any) => v.price_override_cents ?? basePrice));
      if (minPrice < displayPrice) {
        displayPrice = minPrice;
      }
    }
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: row.brand ?? null,
    priceCents: displayPrice,
    compareAtCents: compareAt,
    coverUrl: cover?.url ?? null,
    coverAlt: cover?.alt ?? null,
    hoverUrl: mediaList[1]?.url ?? null,
    isOutOfStock,
    publishedAt: row.published_at ?? null,
  };
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
        sort: z.enum(["newest", "price_asc", "price_desc", "in_stock"]).default("newest"),
        minCents: z.number().int().min(0).optional(),
        maxCents: z.number().int().min(0).optional(),
      })
      .default({}),
  )
  .handler(async ({ data: params }) => {
    try {
      const db = getAnonServerClient();
      const storeId = await resolveTenantStoreId();

      if (!storeId) {
        throw new Error("Nenhuma loja foi configurada. Configure a loja no painel de administração.");
      }

      const selectQuery = params.categorySlug
        ? `id, slug, title, brand, price_cents, compare_at_cents, published_at,
           product_media(url, alt, sort_order),
           product_categories!inner(categories!inner(slug)),
           product_variants(status, price_override_cents, stock_on_hand, stock_reserved)`
        : `id, slug, title, brand, price_cents, compare_at_cents, published_at,
           product_media(url, alt, sort_order),
           product_variants(status, price_override_cents, stock_on_hand, stock_reserved)`;

      // Determine sort order — price sorting must be done post-fetch since effective price
      // depends on variant override logic (server-calculated, never trusted from client)
      const dbOrderField =
        params.sort === "price_asc" || params.sort === "price_desc"
          ? "price_cents" // approximate — fine-tuned after mapping
          : "published_at";
      const dbOrderAsc = params.sort === "price_asc";

      let query = db
        .from("products")
        .select(selectQuery)
        .eq("store_id", storeId)
        .eq("status", "published")
        .order(dbOrderField, { ascending: dbOrderAsc })
        .limit(params.limit * 2); // fetch more to allow client-side re-sort after mapping

      if (params.categorySlug) {
        query = query.eq("product_categories.categories.slug", params.categorySlug);
      }

      // Price range filter (applied on base price_cents — server enforced)
      if (params.minCents != null) {
        query = query.gte("price_cents", params.minCents);
      }
      if (params.maxCents != null) {
        query = query.lte("price_cents", params.maxCents);
      }

      if (params.cursor) {
        query = query.lt("id", params.cursor);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[catalog.functions] listPublishedProducts:", error.message);
        throw new Error("Não foi possível carregar os produtos." );
      }

      if (!data || data.length === 0) {
        return { status: "empty" };
      }

      let products: ProductCardDTO[] = data.map(mapProductCardDTO);

      // Post-map sort for price (uses effective price from variant, not DB price_cents)
      if (params.sort === "price_asc") {
        products = products.sort((a, b) => a.priceCents - b.priceCents);
      } else if (params.sort === "price_desc") {
        products = products.sort((a, b) => b.priceCents - a.priceCents);
      } else if (params.sort === "in_stock") {
        products = products.filter((p) => !p.isOutOfStock);
      }

      // Trim to requested limit after sorting
      products = products.slice(0, params.limit);

      return { status: "ok", data: products };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) {
        return { status: "unconfigured", reason: "Nossa vitrine está passando por uma rápida atualização técnica." };
      }
      console.error("[catalog.functions] unexpected error:", e);
      return { status: "error", message: e instanceof Error ? e.message : "Erro inesperado ao carregar produtos." };
    }
  });


// ---------------------------------------------------------------------------
// listPublishedCategories
// ---------------------------------------------------------------------------

export const listPublishedCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = getAnonServerClient();
      const storeId = await resolveTenantStoreId();

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
        throw new Error("Não foi possível carregar as categorias." );
      }

      if (!data || data.length === 0) {
        return [];
      }

      const categories: CategoryDTO[] = data.map((row) => ({
        id: row.id as string,
        slug: row.slug as string,
        name: row.name as string,
        coverUrl: (row.cover_url as string | null) ?? null,
      }));

      return categories ;
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) {
        return {
          status: "unconfigured",
          reason: "Nossas categorias de calçados estão em manutenção temporária.",
        };
      }
      throw new Error("Erro inesperado ao carregar categorias." );
    }
  },
);

// ---------------------------------------------------------------------------
// getStoreConfig
// ---------------------------------------------------------------------------

export const getStoreConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = getAnonServerClient();

      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      if (!storeId) {
        return {
          status: "unconfigured",
          reason: "Nenhuma loja configurada.",
        };
      }

      const { data, error } = await db
        .from("stores")
        .select("id, name, settings")
        .eq("id", storeId)
        .single();

      if (error || !data) {
        throw new Error("Nenhuma loja configurada. Crie a loja no painel de administração.");
      }
      if (!storeId) {
        throw new Error("Nenhuma loja foi configurada. Configure a loja no painel de administração.");
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
        faviconUrl: typeof settings.faviconUrl === "string" ? settings.faviconUrl : null,
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

      return config ;
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) {
        return {
          status: "unconfigured",
          reason: "As configurações e dados da loja estão sendo restabelecidos.",
        };
      }
      throw new Error("Erro inesperado ao carregar configurações da loja." );
    }
  },
);
export const searchProducts = createServerFn({ method: "GET" })
  .validator(z.object({ query: z.string().min(1) }))
  .handler(async ({ data: { query } }) => {
    try {
      const db = await getAnonServerClient();
      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const store = { id: storeId };
      if (!storeId) {
        throw new Error("Loja não encontrada.");
      }

      const selectFields = `
        id,
        title,
        slug,
        brand,
        status,
        published_at,
        priceCents:price_cents,
        compareAtCents:compare_at_cents,
        media:product_media(id, url, alt, sort_order),
        variants:product_variants(status, price_override_cents, stock_on_hand, stock_reserved)
      `;

      // Stage 1: Full-text search using tsvector (Portuguese stemming + stop words)
      const tsQuery = query
        .trim()
        .split(/\s+/)
        .map((w) => w + ":*")
        .join(" & ");

      const { data: ftsData, error: ftsError } = await db
        .from("products")
        .select(selectFields)
        .eq("store_id", store.id)
        .eq("status", "published")
        .textSearch("search_vector", tsQuery, { type: "websearch", config: "portuguese" })
        .order("published_at", { ascending: false })
        .limit(20);

      // If FTS returns results, use them
      if (!ftsError && ftsData && ftsData.length > 0) {
        return ftsData.map(mapProductCardDTO) ;
      }

      // Stage 2: Trigram fallback — match across title, brand, description
      const likePattern = `%${query}%`;
      const { data: trigramData, error: trigramError } = await db
        .from("products")
        .select(selectFields)
        .eq("store_id", store.id)
        .eq("status", "published")
        .or(`title.ilike.${likePattern},brand.ilike.${likePattern},description.ilike.${likePattern}`)
        .order("published_at", { ascending: false })
        .limit(20);

      if (trigramError) {
        throw new Error(trigramError.message );
      }

      if (!trigramData || trigramData.length === 0) {
        return [] ;
      }

      return trigramData.map(mapProductCardDTO) ;
    } catch (e: any) {
      throw new Error(e.message || "Erro desconhecido" );
    }
  });


export const getProductsByCollection = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }) => {
    try {
      const db = await getAnonServerClient();
      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const store = { id: storeId };
      if (!storeId) {
        throw new Error("Loja não encontrada.");
      }

      // First try collection
      const { data: collection, error: collError } = await db
        .from("collections")
        .select("id")
        .eq("store_id", store.id)
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      let productIds: string[] = [];

      if (!collError && collection) {
        // Get product_ids from product_collections junction
        const { data: productIdsData } = await db
          .from("product_collections")
          .select("product_id")
          .eq("collection_id", collection.id);
        productIds = productIdsData?.map((row) => row.product_id) || [];
      } else {
        // Fallback: try category
        const { data: category, error: catError } = await db
          .from("categories")
          .select("id")
          .eq("store_id", store.id)
          .eq("slug", slug)
          .single();

        if (catError || !category) {
          return [];
        }

        const { data: productIdsData } = await db
          .from("product_categories")
          .select("product_id")
          .eq("category_id", category.id);
        productIds = productIdsData?.map((row) => row.product_id) || [];
      }

      if (productIds.length === 0) return [];

      const { data, error } = await db
        .from("products")
        .select(
          `id, slug, title, brand, published_at, priceCents:price_cents, compareAtCents:compare_at_cents, status, media:product_media(url, alt, sort_order), variants:product_variants(status, price_override_cents, stock_on_hand, stock_reserved)`,
        )
        .eq("store_id", store.id)
        .eq("status", "published")
        .in("id", productIds)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message );
      if (!data || data.length === 0) return [];

      const mapped: ProductCardDTO[] = data.map(mapProductCardDTO);

      return mapped ;
    } catch (e: any) {
      throw new Error(e.message || "Erro desconhecido" );
    }
  });

export const getPromotionalProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = await getAnonServerClient();
      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const store = { id: storeId };
      if (!storeId) {
        return { status: "unconfigured", reason: "Loja não encontrada." };
      }

      const { data, error } = await db
        .from("products")
        .select(
          `id, slug, title, brand, priceCents:price_cents, compareAtCents:compare_at_cents, status, media:product_media(url, alt, sort_order), variants:product_variants(status, price_override_cents, stock_on_hand, stock_reserved)`,
        )
        .eq("store_id", store.id)
        .eq("status", "published")
        .gt("compare_at_cents", 0)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw new Error(error.message );
      if (!data || data.length === 0) return [];

      // Filter natively to ensure only actual discounts are returned (compare > price)
      const discountedData = data.filter(
        (item) => item.compareAtCents && item.compareAtCents > item.priceCents,
      );
      if (discountedData.length === 0) return [];

      const mapped: ProductCardDTO[] = discountedData.map(mapProductCardDTO);

      return mapped ;
    } catch (e: any) {
      throw new Error(e.message || "Erro desconhecido" );
    }
  },
);

// ---------------------------------------------------------------------------
// getProductDetail (PDP)
// ---------------------------------------------------------------------------

export const getProductDetail = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }) => {
    try {
      const db = getAnonServerClient();
      const { data: store, error: storeError } = await db
        .from("stores")
        .select("id")
        .limit(1)
        .single();

      if (storeError || !store) {
        return {
          status: "unconfigured",
          reason: "Nenhuma loja foi configurada.",
        };
      }

      // Consulta o produto, mídia e variantes em uma única query
      const { data, error } = await db
        .from("products")
        .select(
          `
          id, slug, title, description, brand, price_cents, compare_at_cents,
          status, seo_title, seo_description, options,
          product_media(id, url, alt, media_type, sort_order),
          product_variants(
            id, sku, price_override_cents, stock_on_hand, stock_reserved, attributes,
            product_media(id, url, alt, media_type, sort_order)
          )
        `,
        )
        .eq("store_id", store.id)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error || !data) {
        return { status: "not_found" };
      }

      // Formatar mídia principal do produto
      const media = (data.product_media || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((m: any) => ({
          id: m.id,
          url: m.url,
          alt: m.alt,
          mediaType: m.media_type,
          sortOrder: m.sort_order,
        }));

      // Formatar variantes
      const variants = (data.product_variants || []).map((v: any) => {
        // Mídia específica da variante
        const variantMedia = (v.product_media || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((m: any) => ({
            id: m.id,
            url: m.url,
            alt: m.alt,
            mediaType: m.media_type,
            sortOrder: m.sort_order,
          }));

        // Calcula estoque disponível real: on_hand - reserved
        const availableQty = Math.max(0, (v.stock_on_hand || 0) - (v.stock_reserved || 0));

        return {
          id: v.id,
          sku: v.sku,
          effectivePriceCents: v.price_override_cents ?? data.price_cents,
          availableQty,
          attributes: v.attributes || {},
          media: variantMedia.length > 0 ? variantMedia : media, // Fallback para a mídia do produto
        };
      });

      return {
        status: "ok",
        data: {
          id: data.id,
          slug: data.slug,
          title: data.title,
          description: data.description,
          brand: data.brand,
          options: data.options || [],
          priceCents: data.price_cents,
          compareAtCents: data.compare_at_cents,
          media,
          variants,
          allowsPreorder: false,
          seoTitle: data.seo_title,
          seoDescription: data.seo_description,
        },
      };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) {
        return {
          status: "unconfigured",
          reason: "Nossa vitrine está passando por uma rápida atualização técnica.",
        };
      }
      console.error("[catalog.functions] getProductDetail:", e);
      throw new Error("Erro inesperado ao carregar detalhes do produto." );
    }
  });

// ---------------------------------------------------------------------------
// getPublicStoreProfile — public profile (no auth required)
// ---------------------------------------------------------------------------

export interface PublicStoreProfileDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
  instagramHandle: string | null;
  businessHours: string | null;
  settings: Record<string, any>;
  pixKey?: string | null;
  paymentInstructions?: string | null;
}

export type PublicStoreProfileResult = CatalogResult<PublicStoreProfileDTO>;

export const getPublicStoreProfile = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = getAnonServerClient();

      const { data, error } = await db
        .from("stores")
        .select("id, name, slug, description, phone, email, address, city, state, settings")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error || !data) {
        throw new Error("Loja não encontrada.");
      }

      const settings = (data.settings ?? {}) as Record<string, any>;

      const profile: PublicStoreProfileDTO = {
        id: data.id as string,
        name: data.name as string,
        slug: data.slug as string,
        description: (data.description as string | null) ?? null,
        phone: (data.phone as string | null) ?? null,
        email: (data.email as string | null) ?? null,
        address: (data.address as string | null) ?? null,
        city: (data.city as string | null) ?? null,
        state: (data.state as string | null) ?? null,
        logoUrl: (typeof settings.logoUrl === "string" ? settings.logoUrl : null),
        instagramHandle: (typeof settings.instagramHandle === "string" ? settings.instagramHandle : null),
        businessHours: (typeof settings.businessHours === "string" ? settings.businessHours : null),
        settings,
        pixKey: (typeof settings.pixKey === "string" ? settings.pixKey : null),
        paymentInstructions: (typeof settings.paymentInstructions === "string" ? settings.paymentInstructions : null),
      };

      return profile ;
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) {
        throw new Error("Nossa vitrine está passando por uma rápida atualização técnica.");
      }
      console.error("[catalog.functions] getPublicStoreProfile:", e);
      throw new Error("Erro inesperado ao carregar perfil da loja." );
    }
  },
);

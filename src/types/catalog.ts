/**
 * Catalog DTOs — Hr Shoes Commerce
 *
 * These are transport contracts returned by the BFF (server functions) to
 * the storefront. The client never:
 *   - accesses Supabase directly
 *   - computes prices, discounts, or availability
 *   - trusts frontend stock counts
 *
 * RULES:
 *   - Money = integer amountCents + currency "BRL". Never float.
 *   - All values are server-authoritative.
 *   - `CatalogResult<T>` discriminates between ok / empty / unconfigured states.
 */

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export interface MoneyDTO {
  /** Integer cents. Never a float. Always BRL for this project. */
  amountCents: number;
  currency: "BRL";
}

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  coverUrl?: string | null;
  /** Number of published products in this category (server-computed). */
  productCount?: number;
}

export interface CategoryDetailDTO extends CategoryDTO {
  description?: string | null;
  children: CategoryDTO[];
  seoTitle?: string | null;
  seoDescription?: string | null;
}

// ---------------------------------------------------------------------------
// ProductCard (list / grid view)
// ---------------------------------------------------------------------------

/**
 * Canonical DTO for product cards.
 * Consumed by ProductCard component, SectionRenderer and search results.
 * All commercial values are server-computed before reaching the client.
 */
export interface ProductCardDTO {
  id: string;
  slug: string;
  title: string;
  brand?: string | null;
  /** Server-computed display price. Client only formats it via formatMoney(). */
  priceCents: number;
  /** Optional strikethrough price when on sale (server-decided). */
  compareAtCents?: number | null;
  coverUrl?: string | null;
  coverAlt?: string | null;
  /** True when all active variants are out of stock (server-computed). */
  isOutOfStock?: boolean;
}

// ---------------------------------------------------------------------------
// Product Detail (PDP)
// ---------------------------------------------------------------------------

export interface ProductMediaDTO {
  id: string;
  url: string;
  alt?: string | null;
  mediaType: "image" | "video";
  sortOrder: number;
  focalPoint?: { x: number; y: number } | null;
}

export interface VariantDTO {
  id: string;
  sku: string;
  /** Effective price cents (override or product default — server-computed). */
  effectivePriceCents: number;
  /** Server-computed. Never trust a client-side stock value. */
  availableQty: number;
  /** Attribute key-value pairs. Only string values (e.g. color name, size). */
  attributes: Record<string, string>;
  media: ProductMediaDTO[];
}

export interface ProductDetailDTO {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  brand?: string | null;
  priceCents: number;
  compareAtCents?: number | null;
  media: ProductMediaDTO[];
  variants: VariantDTO[];
  allowsPreorder: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

// ---------------------------------------------------------------------------
// Store Config (dynamic — from stores.settings column)
// ---------------------------------------------------------------------------

export interface AnnouncementDTO {
  id: string;
  text: string;
  link?: string | null;
  isActive: boolean;
}

export interface BenefitDTO {
  id: string;
  icon: string; // lucide icon name
  title: string;
  description: string;
}

export interface HeroBannerDTO {
  id: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  ctaLabel?: string | null;
  ctaLink?: string | null;
}

export interface StoreConfigDTO {
  storeId: string;
  name: string;
  logoUrl?: string | null;
  announcements: AnnouncementDTO[];
  heroBanners: HeroBannerDTO[];
  benefits: BenefitDTO[];
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactAddress?: string | null;
  businessHours?: string | null;
  instagramHandle?: string | null;
}

// ---------------------------------------------------------------------------
// Discriminated result type (for all catalog reads)
// ---------------------------------------------------------------------------

/**
 * Canonical result type for any catalog or config read.
 *
 * `unconfigured` = Supabase not set up yet — show UnconfiguredState (admin)
 *                  or a graceful empty storefront (public)
 * `empty`        = configured but no data yet
 * `ok`           = real data returned
 * `error`        = unexpected server error (show ErrorState + retry)
 */
export type CatalogResult<T> =
  | { status: "ok"; data: T }
  | { status: "empty" }
  | { status: "unconfigured"; reason: string }
  | { status: "error"; message: string };

export type ProductListResult = CatalogResult<ProductCardDTO[]>;
export type CategoryListResult = CatalogResult<CategoryDTO[]>;
export type ProductDetailResult = CatalogResult<ProductDetailDTO> | { status: "not_found" };
export type StoreConfigResult = CatalogResult<StoreConfigDTO>;

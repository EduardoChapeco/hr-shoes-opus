/**
 * Catalog DTOs — shapes returned by the BFF/server layer to the client.
 * These are transport contracts (distinct from persistence entities), so the
 * storefront never touches Supabase directly nor computes commercial values.
 *
 * Money is always integer cents + currency "BRL" (see src/lib/money.ts).
 */

export interface MoneyDTO {
  /** Integer cents. Never a float. */
  amountCents: number;
  currency: "BRL";
}

export interface ProductCardDTO {
  id: string;
  slug: string;
  title: string;
  /** Server-computed display price. Client only formats it. */
  price: MoneyDTO;
  /** Optional strikethrough price when on sale (server-decided). */
  compareAt?: MoneyDTO;
  imageUrl?: string;
  imageAlt?: string;
}

/**
 * Discriminated result for any catalog read. `unconfigured` is a *real*
 * configuration state (no backend/catalog yet) — never a faked success.
 */
export type CatalogResult<T> =
  | { status: "ok"; data: T }
  | { status: "empty" }
  | { status: "unconfigured"; reason: string };

export type ProductListResult = CatalogResult<ProductCardDTO[]>;

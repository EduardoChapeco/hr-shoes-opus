/**
 * Product detail server function — Hr Shoes Commerce (BFF boundary)
 *
 * Single product lookup by slug. Returns full detail DTO including
 * variants with server-computed effective prices, available quantities,
 * display names, media per variant, and all logistics fields.
 * Never exposes cost_cents to the client.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAnonServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import type {
  ProductDetailResult,
  ProductDetailDTO,
  VariantDTO,
  ProductMediaDTO,
} from "@/types/catalog";

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(200) }))
  .handler(async ({ data: { slug } }): Promise<ProductDetailResult> => {
    try {
      const db = getAnonServerClient();

      const { data: product, error } = await db
        .from("products")
        .select(
          `id, slug, title, description, short_description, brand,
           price_cents, compare_at_cents, allows_preorder,
           seo_title, seo_description, meta_title, meta_description,
           manufacturer, ean, is_physical, preparation_time_days,
           weight_kg, width_cm, height_cm, length_cm, status,
           product_media(id, url, alt, media_type, sort_order, focal_point, variant_id),
           product_variants(
             id, sku, display_name, status, price_override_cents,
             stock_on_hand, stock_reserved, attributes, ean,
             weight_kg, width_cm, height_cm, length_cm,
             product_media(id, url, alt, media_type, sort_order, focal_point)
           ),
           product_categories(
             category_id,
             categories(id, name, slug)
           ),
           reviews(id, rating, comment, created_at, status, reviewer_name)
          `,
        )
        .eq("slug", slug)
        .eq("status", "published")
        .eq("reviews.status", "approved")
        .single();

      if (error?.code === "PGRST116") {
        return { status: "not_found" };
      }

      if (error) {
        console.error("[product.functions] getProductBySlug:", error.message);
        return { status: "error", message: "Não foi possível carregar o produto." };
      }

      if (!product) {
        return { status: "not_found" };
      }

      type RawMedia = {
        id: string;
        url: string;
        alt: string | null;
        media_type: string;
        sort_order: number;
        focal_point: { x: number; y: number } | null;
        variant_id?: string | null;
      };
      type RawVariant = {
        id: string;
        sku: string;
        display_name: string | null;
        status: string;
        price_override_cents: number | null;
        stock_on_hand: number;
        stock_reserved: number;
        attributes: Record<string, string>;
        ean: string | null;
        weight_kg: number | null;
        width_cm: number | null;
        height_cm: number | null;
        length_cm: number | null;
        product_media: RawMedia[] | null;
      };

      const mapMedia = (m: RawMedia): ProductMediaDTO => ({
        id: m.id,
        url: m.url,
        alt: m.alt ?? null,
        mediaType: m.media_type as "image" | "video",
        sortOrder: m.sort_order,
        focalPoint: m.focal_point ?? null,
        variantId: (m.variant_id as string | null) ?? null,
      });

      // All product-level media sorted by sort_order
      const sortedMedia: ProductMediaDTO[] = (
        (product.product_media as RawMedia[] | null) ?? []
      )
        .map(mapMedia)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const variants: VariantDTO[] = (
        (product.product_variants as RawVariant[] | null) ?? []
      )
        .filter((v) => v.status === "active")
        .map((v) => ({
          id: v.id,
          sku: v.sku,
          displayName: v.display_name ?? null,
          ean: v.ean ?? null,
          // Server-computed: use override if set, otherwise product base price.
          effectivePriceCents:
            typeof v.price_override_cents === "number"
              ? v.price_override_cents
              : (product.price_cents as number),
          // available_qty computed here — never on client.
          availableQty: Math.max(0, v.stock_on_hand - v.stock_reserved),
          attributes: (v.attributes as Record<string, string>) ?? {},
          // Logistics: variant dims cascade over product dims
          weightKg: v.weight_kg ?? (product.weight_kg as number | null) ?? null,
          widthCm: v.width_cm ?? (product.width_cm as number | null) ?? null,
          heightCm: v.height_cm ?? (product.height_cm as number | null) ?? null,
          lengthCm: v.length_cm ?? (product.length_cm as number | null) ?? null,
          // Variant-specific media; product-level media as fallback is handled on client
          media: ((v.product_media as RawMedia[] | null) ?? [])
            .map(mapMedia)
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }));

      // Canonical SEO: meta_title > seo_title > title
      const canonicalSeoTitle =
        (product.meta_title as string | null) ??
        (product.seo_title as string | null) ??
        null;
      const canonicalSeoDescription =
        (product.meta_description as string | null) ??
        (product.seo_description as string | null) ??
        null;

      const dto: ProductDetailDTO = {
        id: product.id as string,
        slug: product.slug as string,
        title: product.title as string,
        description: (product.description as string | null) ?? null,
        shortDescription: (product.short_description as string | null) ?? null,
        brand: (product.brand as string | null) ?? null,
        manufacturer: (product.manufacturer as string | null) ?? null,
        ean: (product.ean as string | null) ?? null,
        priceCents: product.price_cents as number,
        compareAtCents: (product.compare_at_cents as number | null) ?? null,
        media: sortedMedia,
        variants,
        allowsPreorder: Boolean(product.allows_preorder),
        seoTitle: canonicalSeoTitle,
        seoDescription: canonicalSeoDescription,
        weightKg: (product.weight_kg as number | null) ?? null,
        widthCm: (product.width_cm as number | null) ?? null,
        heightCm: (product.height_cm as number | null) ?? null,
        lengthCm: (product.length_cm as number | null) ?? null,
        isPhysical: product.is_physical !== false,
        preparationTimeDays: (product.preparation_time_days as number | null) ?? 0,
        reviews: ((product.reviews as any[] | null) ?? []).map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer_name: (r.reviewer_name as string | null) ?? null,
        })),
        categories: ((product.product_categories as any[] | null) ?? [])
          .map((pc: any) => pc.categories)
          .filter(Boolean),
      };

      return { status: "ok", data: dto };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) {
        return {
          status: "unconfigured",
          reason: "Os detalhes deste calçado estão temporariamente offline para manutenção.",
        };
      }
      console.error("[product.functions] unexpected error:", e);
      return { status: "error", message: "Erro inesperado ao carregar o produto." };
    }
  });

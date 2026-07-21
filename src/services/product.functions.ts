/**
 * Product detail server function — Hr Shoes Commerce (BFF boundary)
 *
 * Single product lookup by slug. Returns full detail DTO including
 * variants with server-computed effective prices and available quantities.
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
          `id, slug, title, description, brand, price_cents, compare_at_cents,
           allows_preorder, seo_title, seo_description, status,
           meta_title, meta_description, weight_kg, width_cm, height_cm, length_cm, is_physical,
           product_media(id, url, alt, media_type, sort_order, focal_point),
           product_variants(
             id, sku, status, price_override_cents,
             stock_on_hand, stock_reserved, attributes, display_name,
             product_media(id, url, alt, media_type, sort_order, focal_point)
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
      };
      type RawVariant = {
        id: string;
        sku: string;
        status: string;
        price_override_cents: number | null;
        stock_on_hand: number;
        stock_reserved: number;
        attributes: any;
        product_media: RawMedia[] | null;
      };

      const mapMedia = (m: RawMedia): ProductMediaDTO => ({
        id: m.id,
        url: m.url,
        alt: m.alt ?? null,
        mediaType: m.media_type as "image" | "video",
        sortOrder: m.sort_order,
        focalPoint: m.focal_point ?? null,
      });

      const sortedMedia: ProductMediaDTO[] = ((product.product_media as RawMedia[] | null) ?? [])
        .map(mapMedia)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const variants: VariantDTO[] = ((product.product_variants as RawVariant[] | null) ?? [])
        .filter((v) => v.status === "active")
        .map((v) => ({
          id: v.id,
          sku: v.sku,
          // Server-computed: use override if set, otherwise product base price.
          effectivePriceCents:
            typeof v.price_override_cents === "number"
              ? v.price_override_cents
              : (product.price_cents as number),
          // available_qty computed here — never on client.
          availableQty: Math.max(0, v.stock_on_hand - v.stock_reserved),
          attributes: (v.attributes as Record<string, string>) ?? {},
          media: ((v.product_media as RawMedia[] | null) ?? [])
            .map(mapMedia)
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }));

      const dto: ProductDetailDTO = {
        id: product.id as string,
        slug: product.slug as string,
        title: product.title as string,
        description: (product.description as string | null) ?? null,
        brand: (product.brand as string | null) ?? null,
        priceCents: product.price_cents as number,
        compareAtCents: (product.compare_at_cents as number | null) ?? null,
        media: sortedMedia,
        variants,
        allowsPreorder: Boolean(product.allows_preorder),
        seoTitle: (product.seo_title as string | null) ?? null,
        seoDescription: (product.seo_description as string | null) ?? null,
        metaTitle: (product.meta_title as string | null) ?? null,
        metaDescription: (product.meta_description as string | null) ?? null,
        weightKg: (product.weight_kg as number | null) ?? null,
        widthCm: (product.width_cm as number | null) ?? null,
        heightCm: (product.height_cm as number | null) ?? null,
        lengthCm: (product.length_cm as number | null) ?? null,
        isPhysical: product.is_physical !== false,
        reviews: ((product.reviews as any[] | null) ?? []).map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer_name: (r.reviewer_name as string | null) ?? null,
        })),
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

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAnonServerClient } from "@/lib/supabase";
import { setSellerRefCookie } from "@/lib/session";

export const getSellerShowcase = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data: { slug } }) => {
    try {
      const supabase = getAnonServerClient();

      const { data: showcase, error } = await supabase
        .from("seller_showcases")
        .select(
          `
          seller_id,
          slug,
          title,
          description,
          banner_url,
          profiles!inner(full_name)
        `,
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error || !showcase) {
        return { status: "not_found" as const };
      }

      // Track the seller in a cookie so addToCart attributes them automatically
      setSellerRefCookie(showcase.seller_id);

      return {
        status: "success" as const,
        data: {
          id: showcase.seller_id,
          slug: showcase.slug,
          title: showcase.title,
          description: showcase.description,
          bannerUrl: showcase.banner_url,
          fullName: (showcase as any).profiles?.full_name || showcase.title,
        },
      };
    } catch (e: unknown) {
      console.error(e);
      throw new Error("Erro ao buscar vitrine da vendedora" );
    }
  });

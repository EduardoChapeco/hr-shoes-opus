import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCurrentIdentity } from "@/services/cart-helpers";

export const toggleStoreFollow = createServerFn({ method: "POST" })
  .validator(z.object({ storeId: z.string().uuid() }))
  .handler(async ({ data: { storeId } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) {
      throw new Error("Você precisa estar logado para seguir uma loja.");
    }

    // Check if already following
    const { data: existing } = await supabase
      .from("store_followers")
      .select("store_id")
      .eq("store_id", storeId)
      .eq("customer_id", identity.customer_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("store_followers")
        .delete()
        .eq("store_id", storeId)
        .eq("customer_id", identity.customer_id);
      return { following: false };
    } else {
      await supabase
        .from("store_followers")
        .insert({ store_id: storeId, customer_id: identity.customer_id });
      return { following: true };
    }
  });

export const getStoreFollowStatus = createServerFn({ method: "GET" })
  .validator(z.object({ storeId: z.string().uuid() }))
  .handler(async ({ data: { storeId } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) return { following: false };

    const { data: existing } = await supabase
      .from("store_followers")
      .select("store_id")
      .eq("store_id", storeId)
      .eq("customer_id", identity.customer_id)
      .maybeSingle();

    return { following: !!existing };
  });

export const submitProductReview = createServerFn({ method: "POST" })
  .validator(
    z.object({
      storeId: z.string().uuid(),
      productId: z.string().uuid(),
      rating: z.number().min(1).max(5),
      comment: z.string().max(1000).optional(),
    })
  )
  .handler(async ({ data: { storeId, productId, rating, comment } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) {
      throw new Error("Você precisa estar logado para avaliar um produto.");
    }

    const { error } = await supabase.from("reviews").insert({
      store_id: storeId,
      product_id: productId,
      user_id: identity.customer_id,
      rating,
      comment,
      status: "approved",
    });

    if (error) {
      throw new Error("Falha ao enviar avaliação: " + error.message);
    }

    return { success: true };
  });

export const getProductReviewStats = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string().uuid() }))
  .handler(async ({ data: { productId } }) => {
    const supabase = getServerClient();
    const { data, error } = await supabase.rpc("get_product_review_stats", { p_product_id: productId });
    
    if (error || !data) {
      return { average_rating: 0, total_reviews: 0 };
    }
    return data as { average_rating: number, total_reviews: number };
  });

export const getProductReviewsList = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string().uuid() }))
  .handler(async ({ data: { productId } }) => {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, user:auth.users(id, raw_user_meta_data)")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return [];
    
    return data.map((d: any) => ({
      id: d.id,
      rating: d.rating,
      comment: d.comment,
      createdAt: d.created_at,
      userName: d.user?.raw_user_meta_data?.full_name || "Cliente Anonimo"
    }));
  });

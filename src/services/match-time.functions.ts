import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";

/**
 * Inicia ou retoma uma sessão de Match Time (Descoberta) para um cliente autenticado.
 */
export const startMatchTimeSession = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) return { status: "error", message: "Faça login para usar o Match Time." };

    const db = getServerClient();

    const { data: store } = await db.from("stores").select("id").limit(1).single();
    if (!store) return { status: "error", message: "Loja não encontrada." };

    // Verifica se há sessão ativa (sem ended_at)
    const { data: activeSession } = await db
      .from("match_time_sessions")
      .select("id")
      .eq("customer_id", user.id)
      .eq("store_id", store.id)
      .is("ended_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (activeSession) {
      return { status: "success", data: { sessionId: activeSession.id } };
    }

    // Inicia nova sessão
    const { data: newSession, error } = await db
      .from("match_time_sessions")
      .insert({
        store_id: store.id,
        customer_id: user.id,
      })
      .select("id")
      .single();

    if (error) throw error;
    return { status: "success", data: { sessionId: newSession.id } };
  } catch (e: any) {
    return { status: "error", message: e.message };
  }
});

/**
 * Finaliza a sessão.
 */
export const endMatchTimeSession = createServerFn({ method: "POST" })
  .validator(z.object({ sessionId: z.string().uuid() }))
  .handler(async ({ data: { sessionId } }) => {
    try {
      const db = await getServerClient();
      await db
        .from("match_time_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", sessionId);
      return { status: "success" };
    } catch (e: any) {
      return { status: "error", message: e.message };
    }
  });

/**
 * Busca 10 produtos aleatórios (ou mais recentes) que o cliente ainda não avaliou.
 */
export const getNextProductsForSwipe = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) return { status: "error", message: "Faça login para usar o Match Time." };

    const db = getServerClient();

    const { data: store } = await db.from("stores").select("id").limit(1).single();
    if (!store) return { status: "error", message: "Loja não encontrada." };

    // O ideal aqui seria usar uma RPC, mas faremos com query: produtos não presentes em match_time_swipes
    const { data: swiped } = await db
      .from("match_time_swipes")
      .select("product_id")
      .eq("customer_id", user.id);

    const swipedIds = swiped?.map((s) => s.product_id) || [];

    let query = db
      .from("products")
      .select(
        `
          id,
          name,
          slug,
          price_cents,
          compare_at_cents,
          media:product_media(id, url, alt, sort_order)
        `,
      )
      .eq("store_id", store.id)
      .eq("status", "published");

    if (swipedIds.length > 0) {
      // limit filtering by excluded IDs
      // se tiver muitos isso é lento, num projeto real usaríamos SQL Function
      query = query.not("id", "in", `(${swipedIds.join(",")})`);
    }

    const { data: products, error } = await query
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return { status: "success", data: products };
  } catch (e: any) {
    return { status: "error", message: e.message };
  }
});

/**
 * Grava o like/dislike de um produto
 */
export const recordSwipe = createServerFn({ method: "POST" })
  .validator(
    z.object({
      sessionId: z.string().uuid(),
      productId: z.string().uuid(),
      action: z.enum(["like", "dislike", "superlike"]),
    }),
  )
  .handler(async ({ data: { sessionId, productId, action } }) => {
    try {
      const ssrClient = getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) return { status: "error", message: "Não autorizado" };

      const db = getServerClient();
      const { data: store } = await db.from("stores").select("id").limit(1).single();
      if (!store) return { status: "error", message: "Loja não encontrada." };

      const { error } = await db.from("match_time_swipes").insert({
        session_id: sessionId,
        store_id: store.id,
        customer_id: user.id,
        product_id: productId,
        action,
      });

      if (error) {
        // se der conflito de unique constraint (já votou), ignoramos e damos sucesso
        if (error.code === "23505") return { status: "success" };
        throw error;
      }
      return { status: "success" };
    } catch (e: any) {
      return { status: "error", message: e.message };
    }
  });

/**
 * Analisa as métricas de swipe agregadas (Painel Admin)
 */
export const getMatchTimeReport = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = await getServerClient();

    const { data: store } = await db.from("stores").select("id").limit(1).single();
    if (!store) return { status: "error", message: "Loja não encontrada." };

    // Lista top produtos com likes (Na vida real usaria uma RPC/View agregada)
    const { data, error } = await db
      .from("match_time_swipes")
      .select(
        `
          product_id,
          action,
          product:products(name, slug)
        `,
      )
      .eq("store_id", store.id);

    if (error) throw error;

    // Agrupar
    const report: Record<string, { product: any; likes: number; dislikes: number }> = {};
    data?.forEach((row) => {
      if (!report[row.product_id]) {
        report[row.product_id] = { product: row.product, likes: 0, dislikes: 0 };
      }
      if (row.action === "like" || row.action === "superlike") report[row.product_id].likes++;
      if (row.action === "dislike") report[row.product_id].dislikes++;
    });

    const topProducts = Object.values(report)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);

    return { status: "success", data: { topProducts } };
  } catch (e: any) {
    return { status: "error", message: e.message };
  }
});

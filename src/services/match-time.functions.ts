import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr.server";

/**
 * Inicia ou retoma uma sessão de Match Time (Descoberta) para um cliente autenticado.
 */
export const startMatchTimeSession = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Faça login para usar o Match Time." );

    const db = getServerClient();

    const { resolveTenantStoreId } = await import("@/lib/tenant");
    const storeId = await resolveTenantStoreId();
    const store = storeId ? { id: storeId } : null;
    if (!store) throw new Error("Loja não encontrada." );

    // Verifica se há sessão ativa (sem ended_at)
    const { data: activeSession } = await db
      .from("match_time_sessions")
      .select("id")
      .eq("customer_id", user.id)
      .eq("store_id", store.id)
      .is("ended_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeSession) {
      return { status: "success" as const, data: { sessionId: activeSession.id } };
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
    return { status: "success" as const, data: { sessionId: newSession.id } };
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError)
      return { status: "unconfigured" as const, message: "Supabase não configurado." };
    throw new Error(e.message || "Erro ao iniciar sessão." );
  }
});

/**
 * Finaliza a sessão.
 */
export const endMatchTimeSession = createServerFn({ method: "POST" })
  .validator(z.object({ sessionId: z.string().uuid() }))
  .handler(async ({ data: { sessionId } }) => {
    try {
      const db = getServerClient();
      await db
        .from("match_time_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", sessionId);
      return { status: "success" as const };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError)
        return { status: "unconfigured" as const, message: "Supabase não configurado." };
      throw new Error(e.message || "Erro ao encerrar sessão." );
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
    if (!user) throw new Error("Faça login para usar o Match Time." );

    const db = getServerClient();

    const { resolveTenantStoreId } = await import("@/lib/tenant");
    const storeId = await resolveTenantStoreId();
    const store = storeId ? { id: storeId } : null;
    if (!store) throw new Error("Loja não encontrada." );

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
          title,
          slug,
          price_cents,
          compare_at_cents,
          media:product_media(id, url, alt, sort_order)
        `,
      )
      .eq("store_id", store.id)
      .eq("status", "published");

    if (swipedIds.length > 0) {
      query = query.not("id", "in", `(${swipedIds.join(",")})`);
    }

    const { data: products, error } = await query
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return products || [] ;
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError)
      return { status: "unconfigured" as const, message: "Supabase não configurado." };
    throw new Error(e.message || "Erro ao buscar produtos." );
  }
});

/**
 * Gera uma oferta relâmpago de Match Time para um produto específico e vincula ao carrinho do usuário.
 */
export const generateMatchTimeOffer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      sessionId: z.string().uuid(),
      productId: z.string().uuid(),
    }),
  )
  .handler(async ({ data: { sessionId, productId } }) => {
    try {
      const ssrClient = getSSRClient();
      const { data: { user } } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autorizado" );

      const db = getServerClient();
      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const store = storeId ? { id: storeId } : null;
      if (!store) throw new Error("Loja não encontrada." );

      // 1. Create the offer for 15 minutes (50% off for testing, in a real app this comes from a rules table)
      const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();
      const { data: offer, error: offerError } = await db.from("match_time_offers").insert({
        store_id: store.id,
        customer_id: user.id,
        product_id: productId,
        session_id: sessionId,
        discount_percentage: 50, 
        expires_at: expiresAt,
        status: 'active'
      }).select("id").single();

      if (offerError) throw offerError;

      // 2. Link this offer to the user's active cart
      const { data: cart } = await db.from("carts")
        .select("id")
        .eq("status", "active")
        .eq("customer_id", user.id)
        .maybeSingle();

      if (cart) {
        await db.from("carts").update({ match_time_offer_id: offer.id }).eq("id", cart.id);
      }

      return { status: "success" as const, data: { offerId: offer.id, expiresAt } };
    } catch (e: any) {
      throw new Error(e.message || "Erro ao gerar oferta relâmpago." );
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
      if (!user) throw new Error("Não autorizado" );

      const db = getServerClient();
      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const store = storeId ? { id: storeId } : null;
      if (!store) throw new Error("Loja não encontrada." );

      const { error } = await db.from("match_time_swipes").insert({
        session_id: sessionId,
        store_id: store.id,
        customer_id: user.id,
        product_id: productId,
        action,
      });

      if (error) {
        if (error.code === "23505") return { status: "success" as const };
        throw error;
      }
      return { status: "success" as const };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError)
        return { status: "unconfigured" as const, message: "Supabase não configurado." };
      throw new Error(e.message || "Erro ao registrar swipe." );
    }
  });

/**
 * Calcula a afinidade baseada em categorias curtidas e sugere outros produtos.
 * Retorna { matches: Product[], recommendations: Product[] }
 */
export const getCustomerAffinityRecommendations = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const ssrClient = getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autenticado." );

      const db = getServerClient();
      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const store = storeId ? { id: storeId } : null;
      if (!store) throw new Error("Loja não encontrada." );

      // 1. Obter todos os swipes do cliente
      const { data: allSwipes, error: swipesError } = await db
        .from("match_time_swipes")
        .select("product_id, action")
        .eq("customer_id", user.id);

      if (swipesError) throw swipesError;

      const swipedIds = allSwipes?.map((s) => s.product_id) || [];
      const likedProductIds =
        allSwipes
          ?.filter((s) => s.action === "like" || s.action === "superlike")
          .map((s) => s.product_id) || [];

      // Se o cliente não curtiu nada ainda, retorna vazio
      if (likedProductIds.length === 0) {
        return { status: "success" as const, data: { matches: [], recommendations: [] } };
      }

      // 2. Buscar os dados detalhados dos matches (produtos curtidos)
      const { data: matches } = await db
        .from("products")
        .select(
          `
        id, title, slug, price_cents, compare_at_cents,
        media:product_media(id, url, alt, sort_order)
      `,
        )
        .in("id", likedProductIds)
        .eq("status", "published")
        .limit(6);

      // 3. Mapear categorias dos produtos curtidos para calcular afinidades
      const { data: catMappings } = await db
        .from("product_categories")
        .select("category_id, product_id")
        .in("product_id", likedProductIds);

      const swipeMap = new Map(allSwipes?.map((s) => [s.product_id, s.action]) || []);
      const categoryScores: Record<string, number> = {};

      catMappings?.forEach((m) => {
        const action = swipeMap.get(m.product_id) || "like";
        const weight = action === "superlike" ? 2 : 1;
        categoryScores[m.category_id] = (categoryScores[m.category_id] || 0) + weight;
      });

      const topCategories = Object.entries(categoryScores)
        .sort((a, b) => b[1] - a[1])
        .map(([catId]) => catId);

      // 4. Buscar recomendações de afinidade (produtos das mesmas categorias não swipados)
      let recommendations: any[] = [];
      if (topCategories.length > 0) {
        let query = db
          .from("products")
          .select(
            `
          id, title, slug, price_cents, compare_at_cents,
          media:product_media(id, url, alt, sort_order),
          product_categories!inner(category_id)
        `,
          )
          .eq("store_id", store.id)
          .eq("status", "published")
          .in("product_categories.category_id", topCategories.slice(0, 3));

        if (swipedIds.length > 0) {
          query = query.not("id", "in", `(${swipedIds.join(",")})`);
        }

        const { data: recs } = await query.limit(6);
        recommendations = recs || [];
      }

      return {
        status: "success" as const,
        data: {
          matches: matches || [],
          recommendations: recommendations.map((r: any) => {
            const { product_categories, ...rest } = r;
            return rest;
          }),
        },
      };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError)
        return { status: "unconfigured" as const, message: "Supabase não configurado." };
      throw new Error(e.message || "Erro ao calcular recomendações." );
    }
  },
);

/**
 * Analisa as métricas de swipe agregadas, engajamento e afinidades de categoria (Painel Admin)
 */
export const getMatchTimeReport = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

    const { getServerIdentity } = await import("@/lib/identity");
    const { store_id } = await getServerIdentity();
    if (!store_id) throw new Error("Loja não encontrada." );
    const store = { id: store_id };
    if (!store) throw new Error("Loja não encontrada." );

    // 1. Buscar todos os swipes com joins
    const { data: swipes, error } = await db
      .from("match_time_swipes")
      .select(
        `
        id,
        action,
        product_id,
        customer_id,
        product:products(title, slug),
        profile:profiles(id, full_name)
      `,
      )
      .eq("store_id", store.id);

    if (error) throw error;

    // 2. Mapeamento de categorias de todos os produtos
    const { data: catMappings } = await db.from("product_categories").select(`
        product_id,
        category:categories(id, name)
      `);

    const productCategoriesMap: Record<string, Array<{ id: string; name: string }>> = {};
    catMappings?.forEach((m) => {
      if (m.product_id && m.category) {
        if (!productCategoriesMap[m.product_id]) {
          productCategoriesMap[m.product_id] = [];
        }
        productCategoriesMap[m.product_id].push(m.category as any);
      }
    });

    // 3. Processar ranking de produtos
    const productReport: Record<string, { product: any; likes: number; dislikes: number }> = {};
    const categoryScores: Record<string, { name: string; likes: number; dislikes: number }> = {};
    const customerReport: Record<string, { name: string; likes: number; dislikes: number }> = {};

    swipes?.forEach((row: any) => {
      const prodId = row.product_id;
      const isLike = row.action === "like" || row.action === "superlike";

      // Produto ranking
      if (row.product) {
        if (!productReport[prodId]) {
          productReport[prodId] = { product: row.product, likes: 0, dislikes: 0 };
        }
        if (isLike) productReport[prodId].likes++;
        else productReport[prodId].dislikes++;
      }

      // Categoria ranking
      const categories = productCategoriesMap[prodId] || [];
      categories.forEach((cat) => {
        if (!categoryScores[cat.id]) {
          categoryScores[cat.id] = { name: cat.name, likes: 0, dislikes: 0 };
        }
        if (isLike) categoryScores[cat.id].likes++;
        else categoryScores[cat.id].dislikes++;
      });

      // Cliente ranking/engajamento
      const custId = row.customer_id;
      const customerName = row.profile?.full_name || `Cliente #${custId.split("-")[0]}`;
      if (!customerReport[custId]) {
        customerReport[custId] = { name: customerName, likes: 0, dislikes: 0 };
      }
      if (isLike) customerReport[custId].likes++;
      else customerReport[custId].dislikes++;
    });

    const topProducts = Object.values(productReport)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);

    const topCategories = Object.entries(categoryScores)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);

    const activeCustomers = Object.entries(customerReport)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.likes + b.dislikes - (a.likes + a.dislikes))
      .slice(0, 10);

    return {
      status: "success" as const,
      data: {
        topProducts,
        topCategories,
        activeCustomers,
        totalSwipes: swipes?.length || 0,
      },
    };
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError)
      return { status: "unconfigured" as const, message: "Supabase não configurado." };
    throw new Error(e.message || "Erro ao buscar relatório." );
  }
});

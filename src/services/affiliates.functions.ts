/**
 * Affiliates & Attribution server functions — Hr Shoes Commerce
 *
 * Controla o ciclo de vida dos afiliados/vendedoras:
 * - Registro e aprovação de afiliados
 * - Leitura de cookies de atribuição de vendas
 * - Dashboard de desempenho (cliques, conversões, comissão)
 * - Integração com o motor de comissões já existente na tabela `commissions`
 *
 * Regras:
 * - Cookie `hrshoes_affiliate_id` é lido no checkout e passado ao RPC atômico.
 * - Comissão só é gerada quando o pedido atinge status 'paid/processing'.
 * - Cálculo de comissão é feito no servidor (commission_rate no profiles).
 * - Afiliados não têm acesso a dados de outros afiliados.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr.server";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface AffiliatePerformanceDTO {
  sellerId: string;
  sellerName: string;
  commissionRate: number;
  totalOrders: number;
  totalRevenueCents: number;
  totalCommissionCents: number;
  pendingCommissionCents: number;
  paidCommissionCents: number;
}

export interface CommissionSummaryDTO {
  totalPendingCents: number;
  totalPaidCents: number;
  totalCommissionCents: number;
  sellerCount: number;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function getAffiliatePerformanceHandler(filters: {
  startDate?: string;
  endDate?: string;
  sellerId?: string;
}): Promise<AffiliatePerformanceDTO[]> {
  const db = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  // Fetch all sellers of this store
  let sellersQuery = db
    .from("profiles")
    .select("id, full_name, commission_rate")
    .eq("store_id", identity.store_id)
    .in("role", ["seller", "manager"]);

  if (filters.sellerId) {
    sellersQuery = sellersQuery.eq("id", filters.sellerId);
  }

  const { data: sellers, error: sellersError } = await sellersQuery;
  if (sellersError) throw sellersError;
  if (!sellers || sellers.length === 0) return [];

  // Fetch commissions per seller
  let commQuery = db
    .from("commissions")
    .select("seller_id, amount_cents, status, created_at")
    .eq("store_id", identity.store_id);

  if (filters.startDate) commQuery = commQuery.gte("created_at", filters.startDate);
  if (filters.endDate) commQuery = commQuery.lte("created_at", filters.endDate);

  const { data: commissions, error: commError } = await commQuery;
  if (commError) throw commError;

  // Fetch orders attributed to each seller
  let ordersQuery = db
    .from("orders")
    .select("id, total_cents, seller_id, status")
    .eq("store_id", identity.store_id)
    .not("seller_id", "is", null);

  if (filters.startDate) ordersQuery = ordersQuery.gte("created_at", filters.startDate);
  if (filters.endDate) ordersQuery = ordersQuery.lte("created_at", filters.endDate);

  const { data: orders } = await ordersQuery;

  // Build performance map
  const result: AffiliatePerformanceDTO[] = sellers.map((seller: any) => {
    const sellerCommissions = (commissions || []).filter((c: any) => c.seller_id === seller.id);
    const sellerOrders = (orders || []).filter(
      (o: any) =>
        o.seller_id === seller.id &&
        ["paid", "processing", "shipped", "delivered", "completed"].includes(o.status),
    );

    const totalRevenueCents = sellerOrders.reduce(
      (sum: number, o: any) => sum + (o.total_cents || 0),
      0,
    );
    const totalCommissionCents = sellerCommissions.reduce(
      (sum: number, c: any) => sum + (c.amount_cents || 0),
      0,
    );
    const paidCommissionCents = sellerCommissions
      .filter((c: any) => c.status === "paid")
      .reduce((sum: number, c: any) => sum + (c.amount_cents || 0), 0);

    return {
      sellerId: seller.id,
      sellerName: seller.full_name || "Vendedor sem nome",
      commissionRate: seller.commission_rate || 0,
      totalOrders: sellerOrders.length,
      totalRevenueCents,
      totalCommissionCents,
      pendingCommissionCents: totalCommissionCents - paidCommissionCents,
      paidCommissionCents,
    };
  });

  return result.filter((r) => r.totalOrders > 0 || r.totalCommissionCents > 0);
}

export async function getCommissionSummaryHandler(): Promise<CommissionSummaryDTO> {
  const db = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const { data: commissions, error } = await db
    .from("commissions")
    .select("amount_cents, status, seller_id")
    .eq("store_id", identity.store_id);

  if (error) throw error;

  const rows = commissions || [];
  const totalPendingCents = rows
    .filter((c: any) => c.status === "pending")
    .reduce((s: number, c: any) => s + c.amount_cents, 0);
  const totalPaidCents = rows
    .filter((c: any) => c.status === "paid")
    .reduce((s: number, c: any) => s + c.amount_cents, 0);
  const sellerIds = new Set(rows.map((c: any) => c.seller_id));

  return {
    totalPendingCents,
    totalPaidCents,
    totalCommissionCents: totalPendingCents + totalPaidCents,
    sellerCount: sellerIds.size,
  };
}

/**
 * Retorna o perfil de comissão do afiliado logado (auto-consulta).
 */
export async function getMyCommissionProfileHandler() {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const db = getServerClient();

  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name, commission_rate, store_id")
    .eq("id", user.id)
    .single();

  if (!profile?.store_id) throw new Error("Perfil de vendedor não configurado.");

  const { data: commissions } = await db
    .from("commissions")
    .select("amount_cents, status, created_at, orders(public_token)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = commissions || [];
  const totalEarnedCents = rows.reduce((s: number, c: any) => s + c.amount_cents, 0);
  const pendingCents = rows
    .filter((c: any) => c.status === "pending")
    .reduce((s: number, c: any) => s + c.amount_cents, 0);
  const paidCents = rows
    .filter((c: any) => c.status === "paid")
    .reduce((s: number, c: any) => s + c.amount_cents, 0);

  return {
    sellerId: user.id,
    sellerName: profile.full_name || "Vendedor",
    commissionRate: profile.commission_rate || 0,
    totalEarnedCents,
    pendingCents,
    paidCents,
    recentCommissions: rows.map((c: any) => ({
      amountCents: c.amount_cents,
      status: c.status,
      createdAt: c.created_at,
      orderToken: c.orders?.public_token,
    })),
  };
}

/**
 * Gera/obtém o link de afiliação deste vendedor.
 * O link inclui o slug da loja + o ID do vendedor como parâmetro de rastreio.
 */
export async function getAffiliateLinkHandler(baseUrl: string): Promise<{ link: string }> {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const db = getServerClient();
  const { data: profile } = await db
    .from("profiles")
    .select("id, store_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.store_id) throw new Error("Vendedor não associado a uma loja.");
  if (!["seller", "manager", "owner", "admin"].includes(profile.role)) {
    throw new Error("Apenas vendedores podem obter links de afiliação.");
  }

  const link = `${baseUrl}?ref=${user.id}`;
  return { link };
}

/**
 * Lista todos os pedidos atribuídos ao vendedor logado (auto-consulta).
 */
export async function listMyAttributedOrdersHandler() {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const db = getServerClient();
  const { data, error } = await db
    .from("orders")
    .select("id, public_token, status, total_cents, created_at, customer_snapshot")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const getAffiliatePerformance = createServerFn({ method: "GET" })
  .validator(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      sellerId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data: filters }) => {
    try {
      return await getAffiliatePerformanceHandler(filters);
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[affiliates] getAffiliatePerformance:", e.message);
      throw new Error("Erro ao buscar desempenho de afiliados.");
    }
  });

export const getCommissionSummary = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await getCommissionSummaryHandler();
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[affiliates] getCommissionSummary:", e.message);
    throw new Error("Erro ao calcular resumo de comissões.");
  }
});

export const getMyCommissionProfile = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await getMyCommissionProfileHandler();
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[affiliates] getMyCommissionProfile:", e.message);
    throw new Error("Erro ao buscar perfil de comissão.");
  }
});

export const getAffiliateLink = createServerFn({ method: "GET" })
  .validator(z.object({ baseUrl: z.string().url() }))
  .handler(async ({ data: { baseUrl } }) => {
    try {
      return await getAffiliateLinkHandler(baseUrl);
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[affiliates] getAffiliateLink:", e.message);
      throw new Error(e.message || "Erro ao gerar link de afiliação.");
    }
  });

export const listMyAttributedOrders = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await listMyAttributedOrdersHandler();
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[affiliates] listMyAttributedOrders:", e.message);
    throw new Error("Erro ao buscar pedidos atribuídos.");
  }
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";

async function getCurrentIdentity() {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) return { id: null, role: "customer", store_id: null };

  const serverClient = getServerClient();
  const { data: profile } = await serverClient
    .from("profiles")
    .select("role, store_id")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    role: profile?.role || "customer",
    store_id: profile?.store_id || null,
  };
}

export const listCustomers = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getCurrentIdentity();

  if (!identity.store_id || identity.role === "customer") {
    throw new Error("Não autorizado");
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("role", "customer")
    .eq("store_id", identity.store_id);

  if (profilesError) throw new Error("Erro ao buscar clientes");

  const { data: crmData } = await supabase
    .from("customers_crm")
    .select("id, tags")
    .eq("store_id", identity.store_id);

  const crmMap = new Map(crmData?.map((c: any) => [c.id, c.tags]) || []);

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, total_cents, status")
    .eq("store_id", identity.store_id)
    .not("customer_id", "is", null);

  const orderStats = new Map();
  if (orders) {
    for (const order of orders) {
      if (!order.customer_id) continue;
      const stats = orderStats.get(order.customer_id) || { ltv: 0, count: 0 };
      stats.count += 1;
      if (
        ["paid", "processing", "ready_for_pickup", "shipped", "delivered", "completed"].includes(
          order.status,
        )
      ) {
        stats.ltv += order.total_cents;
      }
      orderStats.set(order.customer_id, stats);
    }
  }

  return profiles.map((p: any) => {
    const stats = orderStats.get(p.id) || { ltv: 0, count: 0 };
    return {
      id: p.id,
      name: p.full_name || "Cliente sem nome",
      joinedAt: p.created_at,
      orderCount: stats.count,
      ltvCents: stats.ltv,
      tags: crmMap.get(p.id) || [],
    };
  });
});

export const getCustomer360 = createServerFn({ method: "GET" })
  .validator(z.object({ customerId: z.string().uuid() }))
  .handler(async ({ data: { customerId } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.store_id || identity.role === "customer") {
      throw new Error("Não autorizado");
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .eq("id", customerId)
      .eq("store_id", identity.store_id)
      .single();

    if (error || !profile) throw new Error("Cliente não encontrado");

    const { data: crm } = await supabase
      .from("customers_crm")
      .select("notes, tags")
      .eq("id", customerId)
      .maybeSingle();

    const { data: orders } = await supabase
      .from("orders")
      .select("id, public_token, total_cents, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    return {
      profile: {
        id: profile.id,
        name: profile.full_name || "Cliente sem nome",
        joinedAt: profile.created_at,
      },
      crm: crm || { notes: null, tags: [] },
      orders: orders || [],
    };
  });

export const updateCustomerCrm = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customerId: z.string().uuid(),
      notes: z.string().nullable(),
      tags: z.array(z.string()),
    }),
  )
  .handler(async ({ data: { customerId, notes, tags } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.store_id || identity.role === "customer") {
      throw new Error("Não autorizado");
    }

    const { error } = await supabase.from("customers_crm").upsert({
      id: customerId,
      store_id: identity.store_id,
      notes,
      tags,
    });

    if (error) throw new Error("Erro ao salvar CRM");
    return { status: "success" };
  });

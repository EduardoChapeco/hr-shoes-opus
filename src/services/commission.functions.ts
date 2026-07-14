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

export const listCommissions = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getCurrentIdentity();

  if (!identity.store_id || identity.role === "customer" || !identity.id) {
    throw new Error("Não autorizado");
  }

  let query = supabase
    .from("commissions")
    .select("*, orders(public_token, total_cents), profiles!commissions_seller_id_fkey(full_name)")
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  // Se for apenas seller, restringe às próprias comissões
  if (identity.role === "seller") {
    query = query.eq("seller_id", identity.id);
  }

  const { data: commissions, error } = await query;
  if (error) throw new Error("Erro ao buscar comissões");

  return commissions.map((c: any) => ({
    id: c.id,
    amountCents: c.amount_cents,
    status: c.status,
    createdAt: c.created_at,
    paidAt: c.paid_at,
    orderToken: c.orders?.public_token,
    orderTotal: c.orders?.total_cents,
    sellerName: c.profiles?.full_name || "Vendedor desconhecido",
  }));
});

export const payCommission = createServerFn({ method: "POST" })
  .validator(
    z.object({
      commissionId: z.string().uuid(),
    }),
  )
  .handler(async ({ data: { commissionId } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    // Apenas finance, manager, admin ou owner podem pagar
    if (!identity.store_id || !["owner", "admin", "manager", "finance"].includes(identity.role)) {
      throw new Error("Não autorizado para pagar comissões");
    }

    const { error } = await supabase
      .from("commissions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", commissionId)
      .eq("store_id", identity.store_id)
      .eq("status", "pending");

    if (error) throw new Error("Erro ao pagar comissão");
    return { status: "success" };
  });

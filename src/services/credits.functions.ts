import { createServerFn } from "@tanstack/react-start";
import { getSSRClient } from "@/lib/supabase-ssr.server";

export const getCustomerCredits = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();

    if (!user) throw new Error("Não autorizado");

    const { data: credits, error } = await ssrClient
      .from("customer_credits")
      .select(
        `
        balance_cents,
        customer_credit_transactions ( id, amount_cents, reason, created_at )
      `,
      )
      .eq("customer_id", user.id)
      .maybeSingle();

    if (error) throw error;

    return credits || { balance_cents: 0, customer_credit_transactions: [] };
  } catch (e: any) {
    console.error("[credits] getCustomerCredits error:", e);
    throw new Error("Erro ao buscar créditos." );
  }
});

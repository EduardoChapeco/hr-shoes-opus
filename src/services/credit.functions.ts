import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";
import { insertAuditLog } from "./audit.functions";

export const getCustomerCreditLimit = createServerFn({ method: "GET" })
  .validator((d: { customerId: string }) => d)
  .handler(async ({ data: { customerId } }) => {
    const identity = await getServerIdentity();
    
    if (customerId !== identity.user_id) {
      assertStoreAccess(identity, ["owner", "admin", "finance", "cashier", "manager"]);
    }

    const db = getServerClient();
    const { data, error } = await db
      .from("customer_credit_limits")
      .select("*")
      .eq("store_id", identity.store_id)
      .eq("customer_id", customerId)
      .single();

    if (error && error.code !== "PGRST116") throw new Error("Erro ao buscar limite: " + error.message);
    
    // Se não existir, retorna 0
    return data || { approved_limit_cents: 0, used_credit_cents: 0, is_blocked: false };
  });

export const updateCreditLimit = createServerFn({ method: "POST" })
  .validator((d: { customerId: string; limitCents: number; isBlocked?: boolean }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "finance"]);

    const db = getServerClient();
    const { error } = await db
      .from("customer_credit_limits")
      .upsert({
        store_id: identity.store_id,
        customer_id: data.customerId,
        approved_limit_cents: data.limitCents,
        is_blocked: data.isBlocked ?? false,
      }, { onConflict: 'store_id, customer_id' });

    if (error) throw new Error("Erro ao atualizar limite: " + error.message);

    await insertAuditLog({
      store_id: identity.store_id,
      changed_by: identity.user_id,
      action: "UPDATED_CREDIT_LIMIT",
      table_name: "customer_credit_limits",
      metadata: { customer_id: data.customerId, new_limit: data.limitCents },
    });

    return { success: true };
  });

export const getCustomerInstallments = createServerFn({ method: "GET" })
  .validator((d: { customerId?: string; status?: string }) => d)
  .handler(async ({ data: { customerId, status } }) => {
    const identity = await getServerIdentity();
    const targetCustomer = customerId || identity.user_id;

    if (targetCustomer !== identity.user_id) {
      assertStoreAccess(identity, ["owner", "admin", "finance"]);
    }

    const db = getServerClient();
    let query = db
      .from("credit_installments")
      .select(`*`)
      .eq("store_id", identity.store_id)
      .eq("customer_id", targetCustomer)
      .order("due_date", { ascending: true });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw new Error("Erro ao buscar parcelas: " + error.message);
    return data;
  });

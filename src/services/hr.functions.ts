import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";
import { insertAuditLog } from "./audit.functions";

export const getStoreEmployees = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const db = getServerClient();
  const { data, error } = await db
    .from("memberships")
    .select(`
      user_id,
      role,
      users:user_id ( id, raw_user_meta_data )
    `)
    .eq("store_id", identity.store_id)
    .neq("role", "customer");

  if (error) throw new Error("Erro ao buscar funcionários: " + error.message);
  return data;
});

export const getEmployeeFinancials = createServerFn({ method: "GET" })
  .validator((d: { employeeId?: string; status?: string }) => d)
  .handler(async ({ data: { employeeId, status } }) => {
    const identity = await getServerIdentity();
    
    // Se não passar employeeId, o próprio funcionário está consultando
    const targetEmployee = employeeId || identity.user_id;

    if (targetEmployee !== identity.user_id) {
      assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);
    } else {
      assertStoreAccess(identity, ["owner", "admin", "manager", "finance", "seller", "cashier", "stock"]);
    }

    const db = getServerClient();
    let query = db
      .from("employee_financial_records")
      .select(`*`)
      .eq("store_id", identity.store_id)
      .eq("employee_id", targetEmployee)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw new Error("Erro ao buscar registros financeiros: " + error.message);
    
    return data;
  });

export const addFinancialRecord = createServerFn({ method: "POST" })
  .validator((d: { employeeId: string; type: string; amountCents: number; description?: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

    const db = getServerClient();
    const { error } = await db.from("employee_financial_records").insert({
      store_id: identity.store_id,
      employee_id: data.employeeId,
      type: data.type,
      amount_cents: data.amountCents,
      description: data.description,
      status: "pending"
    });

    if (error) throw new Error("Erro ao adicionar registro: " + error.message);

    await insertAuditLog({
      store_id: identity.store_id,
      changed_by: identity.user_id,
      action: `ADDED_HR_FINANCIAL_RECORD_${data.type.toUpperCase()}`,
      table_name: "employee_financial_records",
      metadata: { employee_id: data.employeeId, amount_cents: data.amountCents },
    });

    return { success: true };
  });

export const closePayrollMonth = createServerFn({ method: "POST" })
  .validator((d: { employeeId: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "finance"]);

    const db = getServerClient();
    
    // Atualiza todos os 'pending' para 'settled'
    const { error } = await db
      .from("employee_financial_records")
      .update({ status: "settled" })
      .eq("store_id", identity.store_id)
      .eq("employee_id", data.employeeId)
      .eq("status", "pending");

    if (error) throw new Error("Erro ao fechar folha: " + error.message);

    await insertAuditLog({
      store_id: identity.store_id,
      changed_by: identity.user_id,
      action: "CLOSED_PAYROLL",
      table_name: "employee_financial_records",
      metadata: { employee_id: data.employeeId },
    });

    return { success: true };
  });

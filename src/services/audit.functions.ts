import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

export async function getAuditLogHandler() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin"]);

  const db = getServerClient();
  const { data, error } = await db
    .from("audit_log")
    .select("id, action, table_name, record_id, changed_by, created_at, metadata")
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Erro ao buscar logs de auditoria: " + error.message);
  }

  return { status: "ok" as const, data: data || [] };
}

export const getAuditLog = createServerFn({ method: "GET" }).handler(getAuditLogHandler);

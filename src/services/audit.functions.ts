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

  return data || [];
}

export const getAuditLog = createServerFn({ method: "GET" }).handler(getAuditLogHandler);

export interface LogActionParams {
  store_id: string;
  changed_by?: string;
  action: string;
  table_name: string;
  record_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Função utilitária para registrar Logs de Auditoria.
 * DEVE ser chamada de dentro de Server Functions / RPCs (Service Role).
 */
export async function insertAuditLog(params: LogActionParams) {
  const db = getServerClient();

  const { error } = await db.from("audit_log").insert({
    store_id: params.store_id,
    changed_by: params.changed_by || null,
    action: params.action,
    table_name: params.table_name,
    record_id: params.record_id || null,
    metadata: params.metadata || {},
  });

  if (error) {
    // Logamos o erro mas não quebramos o fluxo principal da aplicação
    console.error("[audit] Falha ao gravar audit log:", error);
  }
}

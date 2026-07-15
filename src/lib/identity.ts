/**
 * Identidade canônica do usuário autenticado — Hr Shoes Commerce
 *
 * Fonte única de verdade para resolver identity + role + store_id em server functions.
 * Nunca duplicar esta lógica nos arquivos de service.
 *
 * Uso:
 *   import { getServerIdentity } from "@/lib/identity";
 *   const identity = await getServerIdentity();
 */

import { getSSRClient } from "@/lib/supabase-ssr";
import { getServerClient } from "@/lib/supabase";

export interface ServerIdentity {
  /** auth.users.id — null se não autenticado */
  id: string | null;
  /** role do perfil — 'customer' como fallback */
  role: string;
  /** store_id do perfil — null se não vinculado à loja */
  store_id: string | null;
  /** organization_id — null se não vinculado */
  organization_id: string | null;
}

/**
 * Resolve a identidade completa do usuário autenticado no contexto do servidor.
 * Seguro para uso em qualquer createServerFn().
 */
export async function getServerIdentity(): Promise<ServerIdentity> {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  if (!user) {
    return { id: null, role: "customer", store_id: null, organization_id: null };
  }

  const serverClient = getServerClient();
  const { data: profile } = await serverClient
    .from("profiles")
    .select("role, store_id, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    role: profile?.role ?? "customer",
    store_id: profile?.store_id ?? null,
    organization_id: profile?.organization_id ?? null,
  };
}

/**
 * Asserts que o usuário tem acesso de staff à loja.
 * Lança Error se não autorizado.
 */
export function assertStoreAccess(
  identity: ServerIdentity,
  allowedRoles: string[] = ["owner", "admin", "manager", "seller", "finance", "content", "support", "stock"],
): asserts identity is ServerIdentity & { id: string; store_id: string } {
  if (!identity.id || !identity.store_id || !allowedRoles.includes(identity.role)) {
    throw new Error("Não autorizado");
  }
}

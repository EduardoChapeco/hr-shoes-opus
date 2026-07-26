import { getSSRClient } from "./supabase-ssr.server";
import type { Role } from "@/types/domain";

/**
 * Ensures the caller is authenticated and has one of the allowed roles.
 * Throws an Error if unauthorized, which TanStack Start translates to a failure.
 */
export async function requireRole(allowedRoles: Role[]): Promise<{ id: string; role: Role }> {
  const supabase = getSSRClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autorizado. Sessão expirada ou ausente.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Perfil de acesso não encontrado.");
  }

  const userRole = profile.role as Role;

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Acesso negado. Requer um dos seguintes perfis: ${allowedRoles.join(", ")}`);
  }

  return { id: user.id, role: userRole };
}

/**
 * Convenience function to strictly require administrative/managerial access.
 */
export async function requireAdmin() {
  return requireRole(["owner", "admin", "manager", "finance"]);
}

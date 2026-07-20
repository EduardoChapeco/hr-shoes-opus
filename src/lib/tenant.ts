import { getRequestHeader } from "@tanstack/react-start/server";
import { getAnonServerClient } from "@/lib/supabase";

/**
 * Resolve the current store_id based on the HTTP Host header.
 * For now, if the host is missing or it doesn`t match any slug, 
 * it gracefully falls back to the first available store (preserving compatibility during migration).
 */
export async function resolveTenantStoreId(): Promise<string | null> {
  const host = getRequestHeader("host");
  
  // Extract subdomain or matching slug from host if possible
  // E.g., se host for "loja1.localhost:3000", extraimos "loja1"
  let slugToMatch = null;
  if (host) {
    const parts = host.split(".");
    if (parts.length > 1 && parts[0] !== "www") {
      slugToMatch = parts[0];
    }
  }

  const db = getAnonServerClient();

  if (slugToMatch) {
    const { data: matchedStore } = await db
      .from("stores")
      .select("id")
      .eq("slug", slugToMatch)
      .limit(1)
      .maybeSingle();

    if (matchedStore) {
      return matchedStore.id as string;
    }
  }

  // Fallback genérico para manter a compatibilidade se o tenant não for resolvido via subdomínio
  const { data, error } = await db
    .from("stores")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.id as string;
}

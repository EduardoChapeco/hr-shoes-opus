import type { QueryClient } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";

/**
 * Atmoic Cache Clearing
 * Flush all in-memory data from TanStack Router and QueryClient
 * to prevent PII leaks or ghost data cross-contamination when changing tenants/sessions.
 */
export function clearAppCache(router: AnyRouter, queryClient: QueryClient) {
  try {
    // 1. Clear TanStack Query caches (React Query)
    queryClient.clear();
    
    // 2. Clear TanStack Router loaders cache
    router.clearCache();
    
    // 3. Purge LocalStorage guest carts to avoid contaminating the next session
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("cart-storage");
    }
    
    console.info("[cache] All application caches cleared successfully.");
  } catch (error) {
    console.error("[cache] Failed to clear application caches:", error);
  }
}

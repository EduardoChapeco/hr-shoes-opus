/**
 * Route Registry re-export — consolidated.
 * The authoritative data lives in src/lib/routes.ts.
 * This file was created in Phase 0 but the canonical registry
 * already existed in src/lib/routes.ts + src/config/route-registry.ts.
 *
 * @deprecated Use src/config/route-registry.ts or src/lib/routes.ts directly.
 * This file is kept only for backward-compat while refactoring.
 * Will be removed in a future cleanup.
 */
export {
  PUBLIC_ROUTES,
  CUSTOMER_ROUTES,
  ADMIN_ROUTES,
  ALL_ROUTES,
  getRoute,
  toTanstackPath,
} from "@/lib/routes";
export type { RouteEntry } from "@/lib/routes";

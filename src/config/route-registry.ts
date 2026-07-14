/**
 * Canonical route registry — Hr Shoes Commerce.
 *
 * Single programmatic source of truth for route path, label, audience,
 * permission (roles), phase and render status. All navigation UI (public
 * header, footer, mobile bottom nav, admin shell) is derived from here — never
 * duplicate route lists in components.
 *
 * The concrete data lives in `src/lib/routes.ts` (kept there for legacy
 * imports and tests). This module is the documented entry point referenced by
 * AGENTS.md / docs/ROUTES.md; it re-exports the same objects so there is
 * exactly one source of truth.
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

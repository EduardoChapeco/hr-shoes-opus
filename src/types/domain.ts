/**
 * Domain-level shared types — Hr Shoes Commerce.
 * These are lightweight contracts used across the route registry, navigation
 * and UI states. Full domain model lives in docs/DOMAIN_MODEL.md.
 */

/** Membership roles. `visitor` = not authenticated. See docs/SECURITY.md RBAC. */
export type Role =
  | "visitor"
  | "customer"
  | "owner"
  | "admin"
  | "manager"
  | "seller"
  | "stock"
  | "finance"
  | "content"
  | "support";

/** Delivery phases per docs/ROADMAP.md. */
export type Phase = 0 | 1 | 2 | 3 | 4 | 5;

/** Audience an area belongs to. */
export type Audience = "public" | "customer" | "admin";

/**
 * Whether a route renders a real structural page in Phase 0, or a truthful
 * gate. `structural` = real shell/page exists now. `planned` = the route is
 * registered and reachable but shows a "Planejado para a Fase X" state
 * (admin only) — never a fake screen.
 */
export type RouteRenderStatus = "structural" | "planned";

/** Status for external integrations. Never simulate success. */
export type IntegrationStatus = "unconfigured" | "testing" | "active" | "error";

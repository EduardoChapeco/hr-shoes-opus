import { createServerFn } from "@tanstack/react-start";

import type { ProductListResult } from "@/types/catalog";

/**
 * Catalog service (BFF boundary). In Phase 0 there is no catalog backend yet,
 * so this returns a real `unconfigured` state — never fabricated products.
 * When Lovable Cloud + catalog land in Phase 1, this handler queries the
 * server (RLS-protected) and maps entities to DTOs.
 */
export const listPublishedProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductListResult> => {
    // No catalog data source is configured in Phase 0.
    return {
      status: "unconfigured",
      reason: "O catálogo será ativado na Fase 1 (banco e produtos).",
    };
  },
);

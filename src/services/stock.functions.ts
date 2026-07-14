import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";

export const getStockLevels = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        search: z.string().optional(),
      })
      .default({}),
  )
  .handler(async ({ data: params }) => {
    try {
      const db = await getServerClient();

      let query = db
        .from("product_variants")
        .select(
          `
          id, sku, stock_on_hand, stock_reserved,
          products ( id, title, status, store_id )
        `,
        )
        .order("sku");

      if (params.search) {
        // Simple search on SKU or product title
        query = query.or(`sku.ilike.%${params.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { status: "ok", data: data || [] };
    } catch (e: any) {
      console.error("[stock.functions] getStockLevels:", e.message);
      return { status: "error", message: "Erro ao buscar estoque." };
    }
  });

export const adjustStock = createServerFn({ method: "POST" })
  .validator(
    z.object({
      variantId: z.string().uuid(),
      qty: z.number().int(),
      movementType: z.enum(["purchase", "adjustment", "damage", "transfer", "return"]),
      note: z.string().optional(),
    }),
  )
  .handler(async ({ data: params }) => {
    try {
      const db = await getServerClient();

      const { error } = await db.rpc("adjust_stock", {
        p_variant_id: params.variantId,
        p_qty: params.qty,
        p_movement_type: params.movementType,
        p_note: params.note || null,
      });

      if (error) throw error;

      return { status: "ok", message: "Estoque ajustado com sucesso." };
    } catch (e: any) {
      console.error("[stock.functions] adjustStock:", e.message);
      return { status: "error", message: e.message || "Erro ao ajustar estoque." };
    }
  });

export const getStockMovements = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        limit: z.number().int().default(50),
      })
      .default({}),
  )
  .handler(async ({ data: { limit } }) => {
    try {
      const db = await getServerClient();

      const { data, error } = await db
        .from("stock_movements")
        .select(
          `
          id,
          movement_type,
          qty,
          reference_type,
          note,
          created_at,
          variant:product_variants(
            sku,
            product:products(title)
          ),
          actor:auth.users(email)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { status: "ok", data: data || [] };
    } catch (e: any) {
      console.error("[stock.functions] getStockMovements:", e.message);
      return { status: "error", message: "Erro ao buscar ledger de estoque." };
    }
  });

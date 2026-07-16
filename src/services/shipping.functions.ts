import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr.server";

async function getAdminIdentity() {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const db = getServerClient();
  const { data: profile } = await db
    .from("profiles")
    .select("role, store_id")
    .eq("id", user.id)
    .single();

  if (!profile?.store_id || !["owner", "admin", "manager"].includes(profile.role)) {
    throw new Error("Acesso negado");
  }

  return profile;
}

// ---------------------------------------------------------------------------
// Shipping Zones
// ---------------------------------------------------------------------------

export const listShippingZones = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const identity = await getAdminIdentity();
    const db = getServerClient();

    const { data, error } = await db
      .from("shipping_zones")
      .select(
        `
        *,
        rates:shipping_rates(*)
      `,
      )
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[shipping] listShippingZones error:", e);
    return { status: "error" as const, message: "Erro ao listar zonas de frete." };
  }
});

export const upsertShippingZone = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(2),
      regions: z.array(z.string()),
      is_active: z.boolean(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const identity = await getAdminIdentity();
      const db = getServerClient();

      const payload = {
        store_id: identity.store_id,
        name: input.name,
        regions: input.regions,
        is_active: input.is_active,
      };

      let result;
      if (input.id) {
        result = await db
          .from("shipping_zones")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
      } else {
        result = await db.from("shipping_zones").insert(payload).select().single();
      }

      if (result.error) throw result.error;
      return { status: "success" as const, data: result.data };
    } catch (e: any) {
      console.error("[shipping] upsertShippingZone error:", e);
      return { status: "error" as const, message: e.message || "Erro ao salvar zona de frete." };
    }
  });

// ---------------------------------------------------------------------------
// Shipping Rates
// ---------------------------------------------------------------------------

export const upsertShippingRate = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      zone_id: z.string().uuid(),
      name: z.string().min(2),
      price_cents: z.number().min(0),
      min_order_cents: z.number().nullable().optional(),
      estimated_days: z.number().nullable().optional(),
      is_active: z.boolean(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await getAdminIdentity(); // Ensure auth
      const db = getServerClient();

      const payload = {
        zone_id: input.zone_id,
        name: input.name,
        price_cents: input.price_cents,
        min_order_cents: input.min_order_cents || null,
        estimated_days: input.estimated_days || null,
        is_active: input.is_active,
      };

      let result;
      if (input.id) {
        result = await db
          .from("shipping_rates")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
      } else {
        result = await db.from("shipping_rates").insert(payload).select().single();
      }

      if (result.error) throw result.error;
      return { status: "success" as const, data: result.data };
    } catch (e: any) {
      console.error("[shipping] upsertShippingRate error:", e);
      return { status: "error" as const, message: "Erro ao salvar taxa de frete." };
    }
  });

export const deleteShippingRate = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      await getAdminIdentity();
      const db = getServerClient();

      const { error } = await db.from("shipping_rates").delete().eq("id", id);
      if (error) throw error;
      return { status: "success" as const };
    } catch (e) {
      return { status: "error" as const, message: "Erro ao excluir taxa." };
    }
  });

export const calculateShipping = createServerFn({ method: "POST" })
  .validator(z.object({ zipcode: z.string().min(8) }))
  .handler(async ({ data: { zipcode } }) => {
    try {
      const db = getServerClient();
      const { data: storeData } = await db.from("stores").select("id").limit(1).single();
      if (!storeData) throw new Error("Loja não encontrada");

      // Fetch all active zones and their active rates
      const { data: zones } = await db
        .from("shipping_zones")
        .select(
          `
          id, regions,
          rates:shipping_rates(id, name, price_cents, min_order_cents, estimated_days)
        `,
        )
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .eq("rates.is_active", true);

      if (!zones || zones.length === 0) return { status: "ok" as const, data: [] };

      // Find zones that match the zipcode prefix
      // "regions" contains prefixes like "01", "02", "01000", or "*"
      const cleanZip = zipcode.replace(/\D/g, "");

      const matchedRates: any[] = [];

      for (const zone of zones) {
        // Check if any region matches
        const matches = (zone.regions as string[]).some((region) => {
          if (region === "*" || region.toLowerCase() === "brasil") return true;
          return cleanZip.startsWith(region.replace(/\D/g, ""));
        });

        if (matches && zone.rates) {
          // Push all rates from this zone
          matchedRates.push(...zone.rates);
        }
      }

      // If we have overlapping zones, we might have duplicate rate names,
      // but let's just return all matched rates for now.
      return { status: "ok" as const, data: matchedRates };
    } catch (e: any) {
      console.error("[shipping] calculateShipping error:", e);
      return { status: "error" as const, message: "Erro ao calcular frete." };
    }
  });

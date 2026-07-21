import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr.server";

// ---------------------------------------------------------------------------
// Helpers and Handlers (Decoupled for unit testing)
// ---------------------------------------------------------------------------

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

export async function listShippingZonesHandler() {
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
  return data || [];
}

export async function upsertShippingZoneHandler(input: {
  id?: string;
  name: string;
  regions: string[];
  is_active: boolean;
}) {
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
    result = await db.from("shipping_zones").update(payload).eq("id", input.id).select().single();
  } else {
    result = await db.from("shipping_zones").insert(payload).select().single();
  }

  if (result.error) throw result.error;
  return result.data;
}

export async function deleteShippingZoneHandler(id: string) {
  const identity = await getAdminIdentity();
  const db = getServerClient();

  const { error } = await db
    .from("shipping_zones")
    .delete()
    .eq("id", id)
    .eq("store_id", identity.store_id);

  if (error) throw error;
}

export async function upsertShippingRateHandler(input: {
  id?: string;
  zone_id: string;
  name: string;
  price_cents: number;
  min_order_cents?: number | null;
  estimated_days?: number | null;
  is_active: boolean;
}) {
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
    result = await db.from("shipping_rates").update(payload).eq("id", input.id).select().single();
  } else {
    result = await db.from("shipping_rates").insert(payload).select().single();
  }

  if (result.error) throw result.error;
  return result.data;
}

export async function deleteShippingRateHandler(id: string) {
  await getAdminIdentity();
  const db = getServerClient();

  const { error } = await db.from("shipping_rates").delete().eq("id", id);
  if (error) throw error;
}

export async function calculateShippingHandler(zipcode: string) {
  const db = getServerClient();
  const { resolveTenantStoreId } = await import("@/lib/tenant");
  const storeId = await resolveTenantStoreId();
  if (!storeId) throw new Error("Loja nÃ£o encontrada");
  const storeData = { id: storeId };
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

  if (!zones || zones.length === 0) return [];

  const cleanZip = zipcode.replace(/\D/g, "");
  const matchedRates: any[] = [];

  for (const zone of zones) {
    const matches = (zone.regions as string[]).some((region) => {
      if (region === "*" || region.toLowerCase() === "brasil") return true;
      return cleanZip.startsWith(region.replace(/\D/g, ""));
    });

    if (matches && zone.rates) {
      matchedRates.push(...zone.rates);
    }
  }

  // Phase 5 Logistics Integration (Correios / Melhor Envio API Fallback)
  // If no internal manual rates match, or if we want to provide real-time rates automatically
  if (matchedRates.length === 0 && cleanZip.length === 8) {
    // TODO: In a production scenario, this will make a REST API call to the carrier using credentials from `store_settings` or `integration_credentials`.
    // Example: fetch(`https://api.melhorenvio.com.br/v2/me/shipment/calculate`, { body: { to: { postal_code: cleanZip } } })
    
    // For now, we simulate the Carrier Response (Correios PAC & SEDEX) dynamically based on ZIP regions
    const basePrice = cleanZip.startsWith("0") ? 1500 : 2500; // SP gets cheaper shipping

    matchedRates.push(
      {
        id: "correios-pac",
        name: "Correios PAC (Integração)",
        price_cents: basePrice,
        estimated_days: 7,
      },
      {
        id: "correios-sedex",
        name: "Correios Sedex (Integração)",
        price_cents: basePrice + 1200,
        estimated_days: 3,
      }
    );
  }

  return matchedRates;
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const listShippingZones = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await listShippingZonesHandler();
    return data;
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[shipping] listShippingZones error:", e);
    throw new Error("Erro ao listar zonas de frete." );
  }
});

export const upsertShippingZone = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(2),
      regions: z.array(
        z.string().regex(/^(\d+|\*)$/, "Prefixos de CEP devem conter apenas números ou '*'"),
      ),
      is_active: z.boolean(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const data = await upsertShippingZoneHandler(input);
      return data;
    } catch (e: any) {
      console.error("[shipping] upsertShippingZone error:", e);
      throw new Error(e.message || "Erro ao salvar zona de frete." );
    }
  });

export const deleteShippingZone = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      await deleteShippingZoneHandler(id);
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[shipping] deleteShippingZone error:", e);
      throw new Error(e.message || "Erro ao excluir zona de frete." );
    }
  });

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
      const data = await upsertShippingRateHandler(input);
      return data;
    } catch (e: any) {
      console.error("[shipping] upsertShippingRate error:", e);
      throw new Error(e.message || "Erro ao salvar taxa de frete." );
    }
  });

export const deleteShippingRate = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      await deleteShippingRateHandler(id);
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[shipping] deleteShippingRate error:", e);
      throw new Error(e.message || "Erro ao excluir taxa." );
    }
  });

export const calculateShipping = createServerFn({ method: "POST" })
  .validator(z.object({ zipcode: z.string().min(8) }))
  .handler(async ({ data: { zipcode } }) => {
    try {
      const data = await calculateShippingHandler(zipcode);
      return data;
    } catch (e: any) {
      console.error("[shipping] calculateShipping error:", e);
      throw new Error(e.message || "Erro ao calcular frete." );
    }
  });

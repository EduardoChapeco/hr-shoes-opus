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

  // Real Integration with Melhor Envio API (Real-time Freight & Carriers)
  if (cleanZip.length === 8) {
    try {
      const { data: integration } = await db
        .from("integration_credentials")
        .select("is_active, credentials")
        .eq("store_id", storeData.id)
        .eq("provider", "melhor_envio")
        .maybeSingle();

      if (integration?.is_active && integration.credentials?.api_token) {
        const token = integration.credentials.api_token;
        const fromZip = (integration.credentials.postal_code || "89900000").replace(/\D/g, "");
        const isSandbox = integration.credentials.sandbox ?? true;
        const baseUrl = isSandbox
          ? "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate"
          : "https://melhorenvio.com.br/api/v2/me/shipment/calculate";

        const response = await fetch(baseUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "User-Agent": "HrShoesCommerce/1.0",
          },
          body: JSON.stringify({
            from: { postal_code: fromZip },
            to: { postal_code: cleanZip },
            products: [
              {
                id: "shoe-box",
                width: 20,
                height: 15,
                length: 30,
                weight: 1,
                insurance_value: 100,
                quantity: 1,
              },
            ],
          }),
        });

        if (response.ok) {
          const ratesData = await response.json();
          if (Array.isArray(ratesData)) {
            for (const option of ratesData) {
              if (option.error || !option.custom_price || !option.name) continue;
              const priceCents = Math.round(parseFloat(option.custom_price) * 100);
              const estimatedDays = option.delivery_time || option.custom_delivery_time || 5;
              const companyName = option.company?.name ? ` (${option.company.name})` : "";
              matchedRates.push({
                id: `melhor-envio-${option.id}`,
                name: `${option.name}${companyName}`,
                price_cents: priceCents,
                estimated_days: estimatedDays,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("[shipping] Error calculating freight with Melhor Envio API:", err);
    }
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

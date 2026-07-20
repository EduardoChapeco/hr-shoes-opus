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
// Coupons
// ---------------------------------------------------------------------------

export const listCoupons = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const identity = await getAdminIdentity();
    const db = getServerClient();

    const { data, error } = await db
      .from("coupons")
      .select("*")
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[growth] listCoupons error:", e);
    return { status: "error" as const, message: "Erro ao listar cupons." };
  }
});

const couponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(3).toUpperCase(),
  discount_type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
  discount_value: z.number().nonnegative(),
  min_order_cents: z.number().nullable().optional(),
  max_uses: z.number().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean(),
});

export const upsertCoupon = createServerFn({ method: "POST" })
  .validator(couponSchema)
  .handler(async ({ data: input }) => {
    try {
      const identity = await getAdminIdentity();
      const db = getServerClient();

      const payload = {
        store_id: identity.store_id,
        code: input.code,
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        min_order_cents: input.min_order_cents || null,
        max_uses: input.max_uses || null,
        expires_at: input.expires_at || null,
        is_active: input.is_active,
      };

      let result;
      if (input.id) {
        result = await db.from("coupons").update(payload).eq("id", input.id).select().single();
      } else {
        result = await db.from("coupons").insert(payload).select().single();
      }

      if (result.error) throw result.error;
      return { status: "success" as const, data: result.data };
    } catch (e: any) {
      console.error("[growth] upsertCoupon error:", e);
      if (e.code === "23505")
        return { status: "error" as const, message: "Código de cupom já existe." };
      return { status: "error" as const, message: "Erro ao salvar cupom." };
    }
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      const identity = await getAdminIdentity();
      const db = getServerClient();

      const { error } = await db
        .from("coupons")
        .delete()
        .eq("id", id)
        .eq("store_id", identity.store_id);

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[growth] deleteCoupon error:", e);
      return { status: "error" as const, message: "Erro ao excluir cupom." };
    }
  });

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export const listIntegrations = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const identity = await getAdminIdentity();
    const db = getServerClient();

    const { data, error } = await db
      .from("integration_credentials")
      .select("*")
      .eq("store_id", identity.store_id);

    if (error) throw error;
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[growth] listIntegrations error:", e);
    return { status: "error" as const, message: "Erro ao listar integrações." };
  }
});

export const upsertIntegration = createServerFn({ method: "POST" })
  .validator(
    z.object({
      provider: z.enum(["meta_pixel", "google_analytics", "melhor_envio", "nuvemshop", "webhook", "google_merchant_center"]),
      credentials: z.record(z.any()),
      is_active: z.boolean(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const identity = await getAdminIdentity();
      if (identity.role !== "owner" && identity.role !== "admin") {
        throw new Error("Apenas administradores podem gerenciar integrações.");
      }

      const db = getServerClient();

      const { data, error } = await db
        .from("integration_credentials")
        .upsert(
          {
            store_id: identity.store_id,
            provider: input.provider,
            credentials: input.credentials,
            is_active: input.is_active,
          },
          { onConflict: "store_id,provider" },
        )
        .select()
        .single();

      if (error) throw error;
      return { status: "success" as const, data };
    } catch (e: any) {
      console.error("[growth] upsertIntegration error:", e);
      return { status: "error" as const, message: e.message || "Erro ao salvar integração." };
    }
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

const upsellRuleSchema = z.object({
  id: z.string().uuid().optional(),
  trigger_product_id: z.string().uuid(),
  offer_product_id: z.string().uuid(),
  discount_percentage: z.number().min(0).max(100),
  active: z.boolean(),
});

export const listUpsellRules = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);

  const { data, error } = await supabase
    .from("upsell_rules")
    .select(`
      *,
      trigger_product:products!upsell_rules_trigger_product_id_fkey(id, title),
      offer_product:products!upsell_rules_offer_product_id_fkey(id, title)
    `)
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[upsell] listUpsellRules error:", error);
    throw new Error("Erro ao buscar regras de upsell");
  }

  return data;
});

export const createUpsellRule = createServerFn({ method: "POST" })
  .validator(upsellRuleSchema.omit({ id: true }))
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);

    if (input.trigger_product_id === input.offer_product_id) {
      throw new Error("O produto gatilho e o produto oferecido devem ser diferentes.");
    }

    const { data, error } = await supabase
      .from("upsell_rules")
      .insert({
        store_id: identity.store_id,
        trigger_product_id: input.trigger_product_id,
        offer_product_id: input.offer_product_id,
        discount_percentage: input.discount_percentage,
        active: input.active,
      })
      .select()
      .single();

    if (error) {
      console.error("[upsell] createUpsellRule error:", error);
      if (error.code === "23505") {
        throw new Error("Já existe uma regra de upsell cadastrada para este produto gatilho e produto de oferta.");
      }
      throw new Error("Erro ao cadastrar regra de upsell");
    }

    return { status: "success" as const, data };
  });

export const updateUpsellRule = createServerFn({ method: "POST" })
  .validator(upsellRuleSchema)
  .handler(async ({ data: input }) => {
    if (!input.id) throw new Error("ID da regra é obrigatório para atualização.");

    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);

    if (input.trigger_product_id === input.offer_product_id) {
      throw new Error("O produto gatilho e o produto oferecido devem ser diferentes.");
    }

    const { data, error } = await supabase
      .from("upsell_rules")
      .update({
        trigger_product_id: input.trigger_product_id,
        offer_product_id: input.offer_product_id,
        discount_percentage: input.discount_percentage,
        active: input.active,
      })
      .eq("id", input.id)
      .eq("store_id", identity.store_id)
      .select()
      .single();

    if (error) {
      console.error("[upsell] updateUpsellRule error:", error);
      if (error.code === "23505") {
        throw new Error("Já existe uma regra de upsell cadastrada para este produto gatilho e produto de oferta.");
      }
      throw new Error("Erro ao atualizar regra de upsell");
    }

    return { status: "success" as const, data };
  });

export const deleteUpsellRule = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);

    const { error } = await supabase
      .from("upsell_rules")
      .delete()
      .eq("id", id)
      .eq("store_id", identity.store_id);

    if (error) {
      console.error("[upsell] deleteUpsellRule error:", error);
      throw new Error("Erro ao excluir regra de upsell");
    }

    return { status: "success" as const };
  });

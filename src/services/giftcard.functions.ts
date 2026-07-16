import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { getServerClient } from "@/lib/supabase";

import { getServerIdentity, assertStoreAccess } from "@/lib/identity";


// Generate a random 12-char code like ABCD-1234-WXYZ using cryptographically secure randomness
function generateGiftCardCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(12);
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export const createGiftCard = createServerFn({ method: "POST" })
  .validator(
    z.object({
      initialBalanceCents: z.number().int().min(100), // Min 1 BRL
      recipientEmail: z.string().email().optional(),
    }),
  )
  .handler(async ({ data: { initialBalanceCents, recipientEmail } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

    const code = generateGiftCardCode();

    const { error } = await supabase.from("gift_cards").insert({
      store_id: identity.store_id,
      code,
      initial_balance_cents: initialBalanceCents,
      current_balance_cents: initialBalanceCents,
      purchaser_id: identity.id, // For this case, the admin creates it
      recipient_email: recipientEmail || null,
      status: "active",
    });

    if (error) throw new Error("Erro ao gerar cartão presente");

    return { status: "success", code };
  });

export const listGiftCards = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance", "seller"]);

  const { data: cards, error } = await supabase
    .from("gift_cards")
    .select(
      "id, code, initial_balance_cents, current_balance_cents, status, created_at, purchaser_profile:profiles!gift_cards_purchaser_id_fkey(full_name)",
    )
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar cartões presente");

  return cards.map((c: any) => ({
    id: c.id,
    code: c.code,
    initialBalance: c.initial_balance_cents,
    currentBalance: c.current_balance_cents,
    status: c.status,
    createdAt: c.created_at,
    purchaserName: c.purchaser_profile?.full_name || "Sistema",
  }));
});

export const checkGiftCardBalance = createServerFn({ method: "POST" })
  .validator(
    z.object({
      code: z.string().min(5),
    }),
  )
  .handler(async ({ data: { code } }) => {
    const supabase = getServerClient();

    // We do NOT use identity here to restrict by store,
    // because a user might not be logged in or might be a customer checking balance.
    // However, the cart logic should ideally scope to a store.
    // For now, find the card globally or by an injected store_id in context.
    // We'll assume the client is only connected to their tenant's store in a real multi-tenant scenario,
    // but here we just find it by code (assuming codes are globally unique enough, though schema says UNIQUE(store_id, code)).

    const { data: card, error } = await supabase
      .from("gift_cards")
      .select("id, current_balance_cents, status, expires_at")
      .eq("code", code)
      .maybeSingle();

    if (error || !card) throw new Error("Cartão não encontrado");

    if (card.status !== "active") throw new Error("Cartão inativo ou exaurido");

    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      throw new Error("Cartão expirado");
    }

    return {
      id: card.id,
      balanceCents: card.current_balance_cents,
    };
  });

export const cancelGiftCard = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data: { id } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

    const { error } = await supabase
      .from("gift_cards")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("store_id", identity.store_id);

    if (error) throw new Error("Erro ao cancelar cartão presente");

    return { status: "success" };
  });

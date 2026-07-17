import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr.server";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

// Generate a random 12-char code like ABCD-1234-WXYZ using cryptographically secure randomness
// Exclude ambiguous characters (I, O, 0, 1) to prevent user typing mistakes
function generateGiftCardCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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
      purchaser_id: identity.id, // Admin created
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

export const claimGiftCard = createServerFn({ method: "POST" })
  .validator(
    z.object({
      code: z.string().min(5),
    }),
  )
  .handler(async ({ data: { code } }) => {
    const supabase = getServerClient();
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();

    if (!user) throw new Error("Você precisa estar logado para resgatar um vale-presente.");

    const { data: card, error: findError } = await supabase
      .from("gift_cards")
      .select("id, purchaser_id, status, current_balance_cents")
      .eq("code", code)
      .maybeSingle();

    if (findError || !card) throw new Error("Vale-presente inválido ou não encontrado.");
    if (card.status !== "active")
      throw new Error("Este vale-presente já foi utilizado ou está inativo.");
    if (card.current_balance_cents <= 0) throw new Error("Este vale-presente não possui saldo.");

    const { error: updateError } = await supabase
      .from("gift_cards")
      .update({ purchaser_id: user.id })
      .eq("id", card.id);

    if (updateError) throw new Error("Erro ao vincular vale-presente à sua conta.");

    return { status: "success" as const };
  });

export const listCustomerGiftCards = createServerFn({ method: "GET" }).handler(async () => {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) return { status: "unauthenticated" as const, data: [] };

  const supabase = getServerClient();
  const { data: cards, error } = await supabase
    .from("gift_cards")
    .select(
      "id, code, initial_balance_cents, current_balance_cents, status, expires_at, created_at",
    )
    .eq("purchaser_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[giftcard.functions] listCustomerGiftCards error:", error);
    return { status: "error" as const, data: [] };
  }

  return { status: "success" as const, data: cards || [] };
});

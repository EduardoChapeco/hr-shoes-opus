import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";

async function getCurrentIdentity() {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) return { id: null, role: "customer", store_id: null };

  const serverClient = getServerClient();
  const { data: profile } = await serverClient
    .from("profiles")
    .select("role, store_id")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    role: profile?.role || "customer",
    store_id: profile?.store_id || null,
  };
}

export const getActiveRegister = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getCurrentIdentity();

  if (!identity.store_id || identity.role === "customer") {
    throw new Error("Não autorizado");
  }

  const { data: register, error } = await supabase
    .from("cash_registers")
    .select("*, opened_by_profile:profiles!cash_registers_opened_by_fkey(full_name)")
    .eq("store_id", identity.store_id)
    .eq("status", "open")
    .maybeSingle();

  if (error) throw new Error("Erro ao buscar caixa ativo");

  if (!register) return null;

  // Obter saldo atual (soma das entradas)
  const { data: entries } = await supabase
    .from("cash_register_entries")
    .select("amount_cents")
    .eq("register_id", register.id);

  const currentBalanceCents =
    register.initial_balance_cents +
    (entries?.reduce((acc: number, e: any) => acc + e.amount_cents, 0) || 0);

  return {
    ...register,
    currentBalanceCents,
  };
});

export const openRegister = createServerFn({ method: "POST" })
  .validator(
    z.object({
      initialBalanceCents: z.number().int().min(0),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data: { initialBalanceCents, notes } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.store_id || !identity.id || identity.role === "customer") {
      throw new Error("Não autorizado");
    }

    // Verificar se já tem caixa aberto
    const { data: existing } = await supabase
      .from("cash_registers")
      .select("id")
      .eq("store_id", identity.store_id)
      .eq("status", "open")
      .maybeSingle();

    if (existing) {
      throw new Error("Já existe um caixa aberto nesta loja.");
    }

    const { error } = await supabase.from("cash_registers").insert({
      store_id: identity.store_id,
      opened_by: identity.id,
      initial_balance_cents: initialBalanceCents,
      notes: notes || null,
      status: "open",
    });

    if (error) throw new Error("Erro ao abrir caixa: " + error.message);

    return { status: "success" };
  });

export const closeRegister = createServerFn({ method: "POST" })
  .validator(
    z.object({
      registerId: z.string().uuid(),
      countedBalanceCents: z.number().int().min(0),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data: { registerId, countedBalanceCents, notes } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.store_id || !identity.id || identity.role === "customer") {
      throw new Error("Não autorizado");
    }

    const { data: register, error: getError } = await supabase
      .from("cash_registers")
      .select("initial_balance_cents, status")
      .eq("id", registerId)
      .eq("store_id", identity.store_id)
      .single();

    if (getError || !register) throw new Error("Caixa não encontrado");
    if (register.status !== "open") throw new Error("Este caixa não está aberto");

    // Calcular total esperado
    const { data: entries } = await supabase
      .from("cash_register_entries")
      .select("amount_cents")
      .eq("register_id", registerId);

    const expectedBalanceCents =
      register.initial_balance_cents +
      (entries?.reduce((acc: number, e: any) => acc + e.amount_cents, 0) || 0);

    const hasDiscrepancy = countedBalanceCents !== expectedBalanceCents;

    const { error: updateError } = await supabase
      .from("cash_registers")
      .update({
        status: hasDiscrepancy ? "discrepancy" : "closed",
        closed_at: new Date().toISOString(),
        closed_by: identity.id,
        expected_balance_cents: expectedBalanceCents,
        final_balance_cents: countedBalanceCents,
        notes: notes ? notes : hasDiscrepancy ? "Fechado com diferença de caixa" : null,
      })
      .eq("id", registerId);

    if (updateError) throw new Error("Erro ao fechar caixa");

    return {
      status: "success",
      expected: expectedBalanceCents,
      counted: countedBalanceCents,
      discrepancy: hasDiscrepancy,
    };
  });

export const addRegisterEntry = createServerFn({ method: "POST" })
  .validator(
    z.object({
      registerId: z.string().uuid(),
      amountCents: z.number().int(), // negativo = saída
      method: z.enum(["cash", "credit", "debit", "pix", "other"]),
      description: z.string().min(3),
    }),
  )
  .handler(async ({ data: { registerId, amountCents, method, description } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.store_id || identity.role === "customer") {
      throw new Error("Não autorizado");
    }

    const { data: register } = await supabase
      .from("cash_registers")
      .select("status")
      .eq("id", registerId)
      .eq("store_id", identity.store_id)
      .single();

    if (!register || register.status !== "open") {
      throw new Error("Caixa indisponível ou já fechado");
    }

    const { error } = await supabase.from("cash_register_entries").insert({
      register_id: registerId,
      amount_cents: amountCents,
      method,
      description,
    });

    if (error) throw new Error("Erro ao registrar movimentação");

    return { status: "success" };
  });

export const listRegisterShifts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getCurrentIdentity();

  if (!identity.store_id || identity.role === "customer") {
    throw new Error("Não autorizado");
  }

  const { data: registers, error } = await supabase
    .from("cash_registers")
    .select(
      "*, opened_by_profile:profiles!cash_registers_opened_by_fkey(full_name), closed_by_profile:profiles!cash_registers_closed_by_fkey(full_name)",
    )
    .eq("store_id", identity.store_id)
    .order("opened_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar histórico de caixas");
  return registers;
});

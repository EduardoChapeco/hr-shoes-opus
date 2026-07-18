import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  summarizeCashEntries,
  type ActiveCashRegister,
  type CashEntryMethod,
  type CashRegisterEntry,
  type CashRegisterHistoryItem,
  type CashRegisterProfile,
  type CashRegisterStatus,
} from "@/lib/cash";
import { getServerClient } from "@/lib/supabase";
import { assertStoreAccess, getServerIdentity } from "@/lib/identity";

interface CashRegisterRow {
  id: string;
  store_id: string;
  opened_by: string;
  closed_by: string | null;
  opened_at: string;
  closed_at: string | null;
  status: CashRegisterStatus;
  initial_balance_cents: number;
  expected_balance_cents: number | null;
  final_balance_cents: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
}

function profileFor(
  profiles: Map<string, CashRegisterProfile>,
  id: string | null,
): CashRegisterProfile | null {
  if (!id) return null;
  return profiles.get(id) ?? null;
}

async function getProfilesById(ids: string[]): Promise<Map<string, CashRegisterProfile>> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map();

  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", uniqueIds);

  if (error) throw new Error("Erro ao buscar responsáveis do caixa: " + error.message);

  return new Map(
    ((data ?? []) as ProfileRow[]).map((profile) => [profile.id, { full_name: profile.full_name }]),
  );
}

async function getEntriesForRegister(registerId: string): Promise<CashRegisterEntry[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("cash_register_entries")
    .select("id, register_id, order_id, amount_cents, method, description, created_at")
    .eq("register_id", registerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar lançamentos do caixa: " + error.message);

  return (data ?? []) as Array<Omit<CashRegisterEntry, "method"> & { method: CashEntryMethod }>;
}

// ---------------------------------------------------------------------------
// Decoupled Handlers (for unit testing)
// ---------------------------------------------------------------------------

export async function getActiveRegisterHandler(): Promise<ActiveCashRegister | null> {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance", "seller"]);

  const { data: register, error } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("store_id", identity.store_id)
    .eq("status", "open")
    .maybeSingle();

  if (error) throw new Error("Erro ao buscar caixa ativo: " + error.message);
  if (!register) return null;

  const registerRow = register as CashRegisterRow;
  const [profiles, entries] = await Promise.all([
    getProfilesById([registerRow.opened_by]),
    getEntriesForRegister(registerRow.id),
  ]);
  const summary = summarizeCashEntries(registerRow.initial_balance_cents, entries);

  return {
    ...registerRow,
    ...summary,
    opened_by_profile: profileFor(profiles, registerRow.opened_by),
    recentEntries: entries,
  } satisfies ActiveCashRegister;
}

export async function openRegisterHandler(
  initialBalanceCents: number,
  notes?: string,
): Promise<{ status: "success" }> {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

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
}

export async function closeRegisterHandler(
  registerId: string,
  countedBalanceCents: number,
  notes?: string,
): Promise<{ status: string; expected: number; counted: number; discrepancy: boolean }> {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const { data: register, error: getError } = await supabase
    .from("cash_registers")
    .select("initial_balance_cents, status")
    .eq("id", registerId)
    .eq("store_id", identity.store_id)
    .single();

  if (getError || !register) throw new Error("Caixa não encontrado");
  if (register.status !== "open") throw new Error("Este caixa não está aberto");

  const { data: result, error: rpcError } = await supabase.rpc("close_cash_register", {
    p_register_id: registerId,
    p_counted_cents: countedBalanceCents,
    p_user_id: identity.id,
    p_notes: notes || "",
  });

  if (rpcError || !result) {
    throw new Error(
      "Erro atômico ao fechar caixa: " + (rpcError?.message || "Sem resposta do banco"),
    );
  }

  return result as { status: string; expected: number; counted: number; discrepancy: boolean };
}

export async function addRegisterEntryHandler(
  registerId: string,
  amountCents: number,
  method: CashEntryMethod,
  description: string,
): Promise<{ status: "success" }> {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance", "seller"]);

  const { data: register } = await supabase
    .from("cash_registers")
    .select("status, initial_balance_cents")
    .eq("id", registerId)
    .eq("store_id", identity.store_id)
    .single();

  if (!register || register.status !== "open") {
    throw new Error("Caixa indisponível ou já fechado");
  }

  // Strict validation: check if cash drawer balance goes negative on manual sangria
  if (amountCents < 0 && method === "cash") {
    const entries = await getEntriesForRegister(registerId);
    const summary = summarizeCashEntries(register.initial_balance_cents, entries);
    if (summary.currentBalanceCents + amountCents < 0) {
      throw new Error(
        `Sangria indisponível: o saldo em gaveta (${summary.currentBalanceCents / 100} BRL) é insuficiente.`,
      );
    }
  }

  const { error } = await supabase.from("cash_register_entries").insert({
    register_id: registerId,
    amount_cents: amountCents,
    method,
    description,
  });

  if (error) throw new Error("Erro ao registrar movimentação: " + error.message);

  return { status: "success" };
}

export async function listRegisterHistoryHandler(): Promise<CashRegisterHistoryItem[]> {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const { data: registers, error } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("store_id", identity.store_id)
    .order("opened_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar histórico de caixas: " + error.message);

  const registerRows = (registers ?? []) as CashRegisterRow[];

  // Batch profiles and entries to avoid N+1 queries
  const userIds = registerRows.flatMap((r) => [r.opened_by, r.closed_by ?? ""]);
  const registerIds = registerRows.map((r) => r.id);

  const [profiles, allEntriesRes] = await Promise.all([
    getProfilesById(userIds),
    supabase
      .from("cash_register_entries")
      .select("id, register_id, amount_cents, method, description, created_at, order_id")
      .in("register_id", registerIds),
  ]);

  const allEntries = (allEntriesRes.data ?? []) as Array<
    CashRegisterEntry & { method: CashEntryMethod }
  >;
  const entriesByRegister = new Map<string, typeof allEntries>();

  allEntries.forEach((entry) => {
    const list = entriesByRegister.get(entry.register_id) || [];
    list.push(entry);
    entriesByRegister.set(entry.register_id, list);
  });

  return registerRows.map((register) => {
    const entries = entriesByRegister.get(register.id) || [];
    const summary = summarizeCashEntries(register.initial_balance_cents, entries);

    return {
      ...register,
      ...summary,
      currentBalanceCents: register.final_balance_cents ?? summary.currentBalanceCents,
      recentEntries: entries,
      opened_by_profile: profileFor(profiles, register.opened_by),
      closed_by_profile: profileFor(profiles, register.closed_by),
    };
  }) satisfies CashRegisterHistoryItem[];
}

// ---------------------------------------------------------------------------
// Server Functions wrappers
// ---------------------------------------------------------------------------

export const getActiveRegister = createServerFn({ method: "GET" }).handler(async () => {
  return await getActiveRegisterHandler();
});

export const openRegister = createServerFn({ method: "POST" })
  .validator(
    z.object({
      initialBalanceCents: z.number().int().min(0),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data: { initialBalanceCents, notes } }) => {
    return await openRegisterHandler(initialBalanceCents, notes);
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
    return await closeRegisterHandler(registerId, countedBalanceCents, notes);
  });

export const addRegisterEntry = createServerFn({ method: "POST" })
  .validator(
    z.object({
      registerId: z.string().uuid(),
      amountCents: z.number().int(),
      method: z.enum(["cash", "credit", "debit", "pix", "other"]),
      description: z.string().min(3),
    }),
  )
  .handler(async ({ data: { registerId, amountCents, method, description } }) => {
    return await addRegisterEntryHandler(registerId, amountCents, method, description);
  });

export async function processPOSSaleHandler(input: {
  registerId: string;
  items: Array<{
    variantId: string;
    qty: number;
    priceCents: number;
    title: string;
    sku: string;
  }>;
  paymentMethod: "cash" | "pix" | "credit" | "debit" | "other";
  discountCents?: number;
  customerName?: string;
  customerId?: string | null;
  amountPaidCents?: number;
}) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "finance"]);

  // 1. Validate open register
  const { data: register, error: regErr } = await supabase
    .from("cash_registers")
    .select("id, status")
    .eq("id", input.registerId)
    .single();

  if (regErr || !register || register.status !== "open") {
    throw new Error("É necessário ter um caixa aberto para realizar vendas de balcão.");
  }

  if (!input.items || input.items.length === 0) {
    throw new Error("O carrinho do PDV não possui itens.");
  }

  // 2. Compute totals
  const subtotalCents = input.items.reduce(
    (acc, item) => acc + item.priceCents * item.qty,
    0,
  );
  const discountCents = Math.max(0, input.discountCents || 0);
  const totalCents = Math.max(0, subtotalCents - discountCents);

  const amountPaid = input.amountPaidCents || totalCents;
  const changeCents = input.paymentMethod === "cash" ? Math.max(0, amountPaid - totalCents) : 0;

  // 3. Deduct stock for each item
  for (const item of input.items) {
    await supabase.rpc("adjust_stock", {
      p_variant_id: item.variantId,
      p_qty: -Math.abs(item.qty),
      p_movement_type: "sale",
      p_note: `Venda PDV Balcão - SKU: ${item.sku}`,
    });
  }

  // 4. Create the Order in the database
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      store_id: identity.store_id,
      customer_id: input.customerId || null,
      status: "delivered", // Concluded on the spot
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      shipping_method: "pickup",
      shipping_cents: 0,
      seller_id: identity.id,
      paid_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
      customer_snapshot: { name: input.customerName || "Cliente Avulso" },
      items_snapshot: input.items.map(item => ({
        variant_id: item.variantId,
        qty: item.qty,
        price_cents: item.priceCents,
        title: item.title,
        sku: item.sku
      }))
    })
    .select("id, public_token")
    .single();

  if (orderErr) {
    throw new Error("Erro ao gerar o pedido: " + orderErr.message);
  }

  // 5. Create Order Items (order_items table)
  const orderItemsToInsert = input.items.map(item => ({
    order_id: order.id,
    variant_id: item.variantId,
    product_title: item.title,
    variant_sku: item.sku,
    qty: item.qty,
    unit_price_cents: item.priceCents,
    total_cents: item.priceCents * item.qty,
    variant_attributes: {}
  }));

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(orderItemsToInsert);

  if (itemsErr) {
    throw new Error("Erro ao registrar itens do pedido: " + itemsErr.message);
  }

  // 6. Create the Payment record (payments table)
  let paymentMethodDb: "pix" | "credit_card" | "manual" | "receipt" = "manual";
  if (input.paymentMethod === "pix") paymentMethodDb = "pix";
  else if (input.paymentMethod === "credit" || input.paymentMethod === "debit") {
    paymentMethodDb = "credit_card";
  }

  const { error: paymentErr } = await supabase
    .from("payments")
    .insert({
      order_id: order.id,
      store_id: identity.store_id,
      method: paymentMethodDb,
      status: "paid",
      amount_cents: totalCents,
      idempotency_key: `pos-${order.id}-${Date.now()}`,
      paid_at: new Date().toISOString(),
      provider_name: "PDV Balcão"
    });

  if (paymentErr) {
    throw new Error("Erro ao registrar pagamento: " + paymentErr.message);
  }

  // 7. Add cash register entry (linked to order_id)
  const { data: entry, error: entryErr } = await supabase
    .from("cash_register_entries")
    .insert({
      register_id: input.registerId,
      order_id: order.id,
      amount_cents: totalCents,
      method: input.paymentMethod,
      description: `Venda PDV Balcão (${input.customerName || "Cliente Avulso"}) - Pedido: ${order.public_token}`,
    })
    .select("id")
    .single();

  if (entryErr) {
    throw new Error("Erro ao registrar venda no caixa: " + entryErr.message);
  }

  return {
    status: "success" as const,
    receiptId: entry.id,
    orderId: order.id,
    orderToken: order.public_token,
    subtotalCents,
    discountCents,
    totalCents,
    changeCents,
    customerName: input.customerName || "Cliente Avulso",
    timestamp: new Date().toISOString(),
  };
}

export const processPOSSale = createServerFn({ method: "POST" })
  .validator(
    z.object({
      registerId: z.string().uuid(),
      items: z.array(
        z.object({
          variantId: z.string().uuid(),
          qty: z.number().int().min(1),
          priceCents: z.number().int().min(0),
          title: z.string(),
          sku: z.string(),
        }),
      ),
      paymentMethod: z.enum(["cash", "pix", "credit", "debit", "other"]),
      discountCents: z.number().int().min(0).optional(),
      customerName: z.string().optional(),
      customerId: z.string().uuid().nullable().optional(),
      amountPaidCents: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ data }) => {
    return await processPOSSaleHandler(data);
  });


export const listRegisterHistory = createServerFn({ method: "GET" }).handler(async () => {
  return await listRegisterHistoryHandler();
});

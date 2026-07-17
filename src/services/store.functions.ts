import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

// --- DADOS DA LOJA ---

export async function getStoreSettingsHandler() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const db = getServerClient();
  const { data: store, error } = await db
    .from("stores")
    .select("id, name, slug, email, phone, cnpj, address, city, state, zip_code, description")
    .eq("id", identity.store_id)
    .single();

  if (error || !store) {
    throw new Error("Loja não encontrada ou erro ao carregar configurações");
  }

  return { status: "ok" as const, data: store };
}

export const getStoreSettings = createServerFn({ method: "GET" }).handler(getStoreSettingsHandler);

export const saveStoreSettingsSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  cnpj: z.string().max(18).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zip_code: z.string().max(9).optional(),
  description: z.string().max(500).optional(),
});

export async function saveStoreSettingsHandler(data: z.infer<typeof saveStoreSettingsSchema>) {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin"]);

  const db = getServerClient();
  const { error } = await db
    .from("stores")
    .update(data)
    .eq("id", identity.store_id);

  if (error) {
    throw new Error("Erro ao salvar dados da loja: " + error.message);
  }

  return { status: "success" };
}

export const saveStoreSettings = createServerFn({ method: "POST" })
  .validator(saveStoreSettingsSchema)
  .handler(async ({ data }) => saveStoreSettingsHandler(data));


// --- POLÍTICAS DA LOJA ---

export async function getPoliciesHandler() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const db = getServerClient();
  const { data: store, error } = await db
    .from("stores")
    .select("id, policies")
    .eq("id", identity.store_id)
    .single();

  if (error || !store) {
    throw new Error("Loja não encontrada ou erro ao carregar políticas");
  }

  return { status: "ok" as const, data: store };
}

export const getPolicies = createServerFn({ method: "GET" }).handler(getPoliciesHandler);

export const savePoliciesSchema = z.object({
  privacy_policy: z.string(),
  return_policy: z.string(),
  terms: z.string(),
});

export async function savePoliciesHandler(data: z.infer<typeof savePoliciesSchema>) {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin"]);

  const db = getServerClient();
  const { error } = await db
    .from("stores")
    .update({ policies: data })
    .eq("id", identity.store_id);

  if (error) {
    throw new Error("Erro ao salvar políticas: " + error.message);
  }

  return { status: "success" };
}

export const savePolicies = createServerFn({ method: "POST" })
  .validator(savePoliciesSchema)
  .handler(async ({ data }) => savePoliciesHandler(data));


// --- SEO DA LOJA ---

export async function getStoreSeoHandler() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const db = getServerClient();
  const { data: store, error } = await db
    .from("stores")
    .select("id, seo_title, seo_description, seo_keywords")
    .eq("id", identity.store_id)
    .single();

  if (error || !store) {
    throw new Error("Loja não encontrada ou erro ao carregar SEO");
  }

  return { status: "ok" as const, data: store };
}

export const getStoreSeo = createServerFn({ method: "GET" }).handler(getStoreSeoHandler);

export const saveStoreSeoSchema = z.object({
  seo_title: z.string().max(60),
  seo_description: z.string().max(160),
  seo_keywords: z.string(),
});

export async function saveStoreSeoHandler(data: z.infer<typeof saveStoreSeoSchema>) {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin"]);

  const db = getServerClient();
  const { error } = await db
    .from("stores")
    .update(data)
    .eq("id", identity.store_id);

  if (error) {
    throw new Error("Erro ao salvar SEO: " + error.message);
  }

  return { status: "success" };
}

export const saveStoreSeo = createServerFn({ method: "POST" })
  .validator(saveStoreSeoSchema)
  .handler(async ({ data }) => saveStoreSeoHandler(data));


// --- PERFIL PÚBLICO DA LOJA ---

export async function getPublicProfileHandler() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "support", "finance", "seller"]);

  const db = getServerClient();
  const { data: store, error } = await db
    .from("stores")
    .select("id, name, description, logo_url, address, phone, business_hours, social_links")
    .eq("id", identity.store_id)
    .single();

  if (error || !store) {
    throw new Error("Loja não encontrada ou erro ao carregar perfil público");
  }

  return { status: "ok" as const, data: store };
}

export const getPublicProfile = createServerFn({ method: "GET" }).handler(getPublicProfileHandler);

export const savePublicProfileSchema = z.object({
  description: z.string().max(500),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  business_hours: z.string().max(200).optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
});

export async function savePublicProfileHandler(data: z.infer<typeof savePublicProfileSchema>) {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin"]);

  const db = getServerClient();
  const { error } = await db
    .from("stores")
    .update(data)
    .eq("id", identity.store_id);

  if (error) {
    throw new Error("Erro ao salvar perfil público: " + error.message);
  }

  return { status: "success" };
}


export const savePublicProfile = createServerFn({ method: "POST" })
  .validator(savePublicProfileSchema)
  .handler(async ({ data }) => savePublicProfileHandler(data));


// --- CONFIGURAÇÕES DE PAGAMENTO ---

export async function getPaymentSettingsHandler() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const db = getServerClient();
  const { data: store, error } = await db
    .from("stores")
    .select("id, pix_key, payment_instructions")
    .eq("id", identity.store_id)
    .single();

  if (error || !store) {
    throw new Error("Loja não encontrada");
  }

  return { status: "ok" as const, data: store };
}

export const getPaymentSettings = createServerFn({ method: "GET" })
  .handler(getPaymentSettingsHandler);

export const savePaymentSettingsSchema = z.object({
  pix_key: z.string().max(255).optional().or(z.literal("")),
  payment_instructions: z.string().max(1000).optional().or(z.literal("")),
});

export const savePaymentSettings = createServerFn({ method: "POST" })
  .validator(savePaymentSettingsSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin"]);

    const db = getServerClient();
    const { error } = await db
      .from("stores")
      .update(data)
      .eq("id", identity.store_id);

    if (error) throw new Error("Erro ao salvar configurações de pagamento: " + error.message);

    return { status: "success" as const };
  });

/**
 * Public-facing: Returns PIX key and payment instructions for a specific order.
 * Uses service role so it's safe to call from customer-facing server functions.
 * The order's store_id is used to look up the store, ensuring tenant isolation.
 */
export async function getStorePaymentInfoByOrderId(orderId: string) {
  const db = getServerClient();

  // Get the store_id from the order (service role bypasses RLS safely)
  const { data: order } = await db
    .from("orders")
    .select("store_id")
    .eq("id", orderId)
    .single();

  if (!order?.store_id) return null;

  const { data: store } = await db
    .from("stores")
    .select("pix_key, payment_instructions")
    .eq("id", order.store_id)
    .single();

  return store || null;
}

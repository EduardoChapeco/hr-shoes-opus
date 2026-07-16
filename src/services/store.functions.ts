import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

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

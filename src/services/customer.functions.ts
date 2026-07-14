import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";

const AddressSchema = z.object({
  zipcode: z.string().min(8),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
});

export const getCustomerAddresses = createServerFn({ method: "GET" }).handler(async () => {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const supabase = getServerClient();
  const { data } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return data || [];
});

export const addCustomerAddress = createServerFn({ method: "POST" })
  .validator(AddressSchema)
  .handler(async ({ data: params }) => {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const supabase = getServerClient();
    const { data: store } = await supabase.from("stores").select("id").limit(1).single();
    if (!store) throw new Error("Loja não encontrada");

    // Check if it's the first address to make it default
    const existing = await getCustomerAddresses();
    const isDefault = existing.length === 0;

    const { error } = await supabase.from("customer_addresses").insert({
      customer_id: user.id,
      store_id: store.id,
      ...params,
      is_default: isDefault,
    });

    if (error) throw new Error(error.message);
    return { status: "success" };
  });

export const deleteCustomerAddress = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const supabase = getServerClient();
    const { error } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", id)
      .eq("customer_id", user.id);

    if (error) throw new Error(error.message);
    return { status: "success" };
  });

export const setDefaultAddress = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const supabase = getServerClient();

    // Unset current default
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", user.id);

    // Set new default
    const { error } = await supabase
      .from("customer_addresses")
      .update({ is_default: true })
      .eq("id", id)
      .eq("customer_id", user.id);

    if (error) throw new Error(error.message);
    return { status: "success" };
  });

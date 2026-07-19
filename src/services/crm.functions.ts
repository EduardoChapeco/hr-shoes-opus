import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

export const listCustomers = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, created_at, tax_id, is_consent_lgpd")
    .eq("role", "customer")
    .eq("store_id", identity.store_id);

  if (profilesError) throw new Error("Erro ao buscar clientes");

  const { data: crmData } = await supabase
    .from("customers_crm")
    .select("id, tags")
    .eq("store_id", identity.store_id);

  const crmMap = new Map(crmData?.map((c: any) => [c.id, c.tags]) || []);

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, total_cents, status")
    .eq("store_id", identity.store_id)
    .not("customer_id", "is", null);

  const orderStats = new Map();
  if (orders) {
    for (const order of orders) {
      if (!order.customer_id) continue;
      const stats = orderStats.get(order.customer_id) || { ltv: 0, count: 0 };
      stats.count += 1;
      if (
        ["paid", "processing", "ready_for_pickup", "shipped", "delivered", "completed"].includes(
          order.status,
        )
      ) {
        stats.ltv += order.total_cents;
      }
      orderStats.set(order.customer_id, stats);
    }
  }

  return profiles.map((p: any) => {
    const stats = orderStats.get(p.id) || { ltv: 0, count: 0 };
    return {
      id: p.id,
      name: p.full_name || "Cliente sem nome",
      taxId: p.tax_id,
      isConsentLgpd: p.is_consent_lgpd,
      joinedAt: p.created_at,
      orderCount: stats.count,
      ltvCents: stats.ltv,
      tags: crmMap.get(p.id) || [],
    };
  });
});

export const getCustomer360 = createServerFn({ method: "GET" })
  .validator(z.object({ customerId: z.string().uuid() }))
  .handler(async ({ data: { customerId } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, created_at, tax_id, is_consent_lgpd")
      .eq("id", customerId)
      .eq("store_id", identity.store_id)
      .single();

    if (error || !profile) throw new Error("Cliente não encontrado");

    const { data: crm } = await supabase
      .from("customers_crm")
      .select("notes, tags")
      .eq("id", customerId)
      .maybeSingle();

    const { data: orders } = await supabase
      .from("orders")
      .select("id, public_token, total_cents, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    const { data: addresses } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customerId)
      .eq("store_id", identity.store_id)
      .order("is_default", { ascending: false });

    return {
      profile: {
        id: profile.id,
        name: profile.full_name || "Cliente sem nome",
        taxId: profile.tax_id,
        isConsentLgpd: profile.is_consent_lgpd,
        joinedAt: profile.created_at,
      },
      crm: crm || { notes: null, tags: [] },
      orders: orders || [],
      addresses: addresses || [],
    };
  });

export const updateCustomerCrm = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customerId: z.string().uuid(),
      notes: z.string().nullable(),
      tags: z.array(z.string()),
    }),
  )
  .handler(async ({ data: { customerId, notes, tags } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

    const { error } = await supabase.from("customers_crm").upsert({
      id: customerId,
      store_id: identity.store_id,
      notes,
      tags,
    });

    if (error) throw new Error("Erro ao salvar CRM");
    return { status: "success" };
  });

export const createCustomerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal("")),
  taxId: z.string().max(20).optional().nullable(),
  isConsentLgpd: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const createCustomer = createServerFn({ method: "POST" })
  .validator(createCustomerSchema)
  .handler(async ({ data: input }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      // 1. Deduplicação - Verifica CPF/CNPJ se fornecido
      if (input.taxId) {
        const { data: existingTax } = await supabase
          .from("profiles")
          .select("id")
          .eq("tax_id", input.taxId)
          .maybeSingle();

        if (existingTax) {
          throw new Error("Já existe um cliente cadastrado com este CPF/CNPJ neste catálogo.");
        }
      }

      // 2. Criar o usuário no Supabase Auth usando o admin client
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: input.email,
        password: "HrShoesCustomer123!",
        email_confirm: true,
        user_metadata: {
          full_name: input.fullName,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered") || authError.message.includes("exists")) {
          throw new Error("Este endereço de e-mail já está em uso por outro cliente.");
        }
        throw new Error(authError.message);
      }

      const userId = authData.user.id;

      // 3. Atualizar o perfil associando a role 'customer', o store_id, tax_id e consentimento LGPD
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          store_id: identity.store_id,
          organization_id: identity.organization_id,
          role: "customer",
          full_name: input.fullName,
          tax_id: input.taxId || null,
          is_consent_lgpd: input.isConsentLgpd,
        })
        .eq("id", userId);

      if (profileError) {
        console.error("[crm] error updating profile:", profileError);
      }

      // 4. Cadastrar tags/anotações se existirem
      if ((input.tags && input.tags.length > 0) || input.notes) {
        const { error: crmError } = await supabase.from("customers_crm").upsert({
          id: userId,
          store_id: identity.store_id,
          notes: input.notes || null,
          tags: input.tags || [],
        });
        if (crmError) {
          console.error("[crm] error saving customers_crm:", crmError);
        }
      }

      return { status: "success" as const, customerId: userId };
    } catch (e: any) {
      console.error("[crm] createCustomer error:", e);
      return { status: "error" as const, message: e.message || "Erro ao cadastrar cliente." };
    }
  });

// ---------------------------------------------------------------------------
// CRM Leads and Pipeline Handlers
// ---------------------------------------------------------------------------

const SubmitContactSchema = z.object({
  storeId: z.string().uuid(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(2),
});

export const submitContactForm = createServerFn({ method: "POST" })
  .validator(SubmitContactSchema)
  .handler(async ({ data: input }) => {
    try {
      const supabase = getServerClient();
      const { error } = await supabase.from("leads_crm").insert({
        store_id: input.storeId,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone || null,
        message: input.message,
        status: "new",
      });
      if (error) throw error;
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[crm] submitContactForm error:", e);
      return { status: "error" as const, message: e.message || "Erro ao enviar mensagem" };
    }
  });

export const listLeads = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

    const { data, error } = await supabase
      .from("leads_crm")
      .select("*")
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { status: "ok" as const, data: data || [] };
  } catch (e: any) {
    console.error("[crm] listLeads error:", e);
    return { status: "error" as const, data: [], message: e.message };
  }
});

export const updateLeadStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      leadId: z.string().uuid(),
      status: z.enum(["new", "contacted", "converted", "lost"]),
    }),
  )
  .handler(async ({ data: { leadId, status } }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      const { error } = await supabase
        .from("leads_crm")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", leadId)
        .eq("store_id", identity.store_id);

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[crm] updateLeadStatus error:", e);
      return { status: "error" as const, message: e.message };
    }
  });

export const promoteLeadToCustomer = createServerFn({ method: "POST" })
  .validator(z.object({ leadId: z.string().uuid() }))
  .handler(async ({ data: { leadId } }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      // Fetch lead details
      const { data: lead, error: fetchError } = await supabase
        .from("leads_crm")
        .select("*")
        .eq("id", leadId)
        .eq("store_id", identity.store_id)
        .single();

      if (fetchError || !lead) throw new Error("Lead não encontrado");

      // Call our existing createCustomer logic
      const promoteRes = await createCustomer({
        data: {
          fullName: lead.full_name,
          email: lead.email,
          phone: lead.phone || "",
          tags: ["Lead Convertido"],
          notes: lead.message ? `Mensagem original: ${lead.message}` : undefined,
        },
      });

      if (promoteRes.status === "error") {
        throw new Error(promoteRes.message);
      }

      // Update lead status
      await supabase
        .from("leads_crm")
        .update({ status: "converted", updated_at: new Date().toISOString() })
        .eq("id", leadId);

      return { status: "success" as const };
    } catch (e: any) {
      console.error("[crm] promoteLeadToCustomer error:", e);
      return { status: "error" as const, message: e.message || "Erro ao converter lead." };
    }
  });

export const upsertCustomerAddress = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      customer_id: z.string().uuid(),
      zipcode: z.string().min(8).max(20),
      street: z.string().min(1),
      number: z.string().min(1),
      complement: z.string().optional().nullable(),
      neighborhood: z.string().min(1),
      city: z.string().min(1),
      state: z.string().length(2),
      is_default: z.boolean().default(false),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      const { id, customer_id, is_default, ...addressFields } = input;

      if (is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("customer_id", customer_id)
          .eq("store_id", identity.store_id);
      }

      const payload = {
        store_id: identity.store_id,
        customer_id,
        is_default,
        ...addressFields,
      };

      let result;
      if (id) {
        result = await supabase
          .from("customer_addresses")
          .update(payload)
          .eq("id", id)
          .eq("store_id", identity.store_id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("customer_addresses")
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return { status: "success" as const, data: result.data };
    } catch (e: any) {
      console.error("[crm] upsertCustomerAddress error:", e);
      return { status: "error" as const, message: e.message || "Erro ao salvar endereço." };
    }
  });

export const deleteCustomerAddress = createServerFn({ method: "POST" })
  .validator(
    z.object({
      addressId: z.string().uuid(),
      customerId: z.string().uuid(),
    }),
  )
  .handler(async ({ data: { addressId, customerId } }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      const { error } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", addressId)
        .eq("customer_id", customerId)
        .eq("store_id", identity.store_id);

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[crm] deleteCustomerAddress error:", e);
      return { status: "error" as const, message: e.message || "Erro ao deletar endereço." };
    }
  });


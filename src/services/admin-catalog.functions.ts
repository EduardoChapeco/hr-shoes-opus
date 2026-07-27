/**
 * Admin Catalog server functions — Hr Shoes Commerce
 *
 * BFF boundary for the Admin Panel. Handles CRUD operations for ProductTypes,
 * Categories, Products, and Variants.
 * Relies on RLS for authorization (user must be staff).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-guards";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Product Types (Formulário Adaptativo)
// ---------------------------------------------------------------------------

export async function listProductTypesHandler() {
  const db = getServerClient();

  // RLS will enforce store isolation
  const { data, error } = await db
    .from("product_types")
    .select("id, name, slug, field_schema, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export const listProductTypes = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await requireAdmin(); // SECURITY FIX
    const data = await listProductTypesHandler();
    return data;
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[admin-catalog] listProductTypes error:", e);
    throw new Error("Erro ao listar tipos de produto.");
  }
});

export async function createProductTypeHandler(input: {
  name: string;
  slug: string;
  field_schema: any[];
}) {
  const db = getServerClient();

  // Need to resolve storeId for insertion
  const { data: storeData } = await db
    .from("stores")
    .select("id, organization_id")
    .limit(1)
    .single();
  if (!storeData) throw new Error("No store found");

  const { data, error } = await db
    .from("product_types")
    .insert({
      organization_id: storeData.organization_id,
      store_id: storeData.id,
      name: input.name,
      slug: input.slug,
      field_schema: input.field_schema,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const createProductType = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1).max(100),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      field_schema: z.array(z.any()), // JSON representation of fields
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await createProductTypeHandler(input);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] createProductType error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao criar tipo de produto.");
    }
  });

export async function updateProductTypeHandler(input: {
  id: string;
  name: string;
  slug: string;
  field_schema: any[];
}) {
  const db = getServerClient();

  const { data, error } = await db
    .from("product_types")
    .update({
      name: input.name,
      slug: input.slug,
      field_schema: input.field_schema,
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const updateProductType = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      field_schema: z.array(z.any()),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await updateProductTypeHandler(input);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] updateProductType error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao atualizar tipo de produto.");
    }
  });

export async function deleteProductTypeHandler(id: string) {
  const db = getServerClient();
  const { error } = await db.from("product_types").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export const deleteProductType = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      await deleteProductTypeHandler(id);
      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[admin-catalog] deleteProductType error:", e);
      throw new Error(
        "Não foi possível excluir o tipo. Verifique se existem produtos cadastrados usando este tipo.",
      );
    }
  });

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function listAdminProductsHandler() {
  const db = getServerClient();
  const { getServerIdentity } = await import("@/lib/identity");
  const { store_id } = await getServerIdentity();
  if (!store_id) throw new Error("Acesso não autorizado.");

  const { data, error } = await db
    .from("products")
    .select(
      `
        id, title, slug, status, price_cents, compare_at_cents, brand,
        product_types (id, name),
        product_media (url, alt, sort_order)
      `,
    )
    .eq("store_id", store_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export const listAdminProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await requireAdmin(); // SECURITY FIX
    const data = await listAdminProductsHandler();
    return data || [];
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[admin-catalog] listAdminProducts error:", e);
    return [];
  }
});

export async function createProductHandler(input: {
  type_id?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  manufacturer?: string | null;
  ean?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  status: "draft" | "published" | "archived";
  brand?: string | null;
  price_cents: number;
  compare_at_cents?: number | null;
  cost_cents?: number | null;
  attributes: Record<string, any>;
  is_physical?: boolean;
  weight_kg?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  length_cm?: number | null;
  preparation_time_days?: number | null;
  media_urls?: string[];
  category_ids?: string[];
  options?: any;

  variants?: {
    sku: string;
    attributes: Record<string, any>;
    price_override_cents?: number | null;
    stock: number;
    image_url?: string | null;
  }[];
}) {
  const db = getServerClient();
  const { getServerIdentity } = await import("@/lib/identity");
  const { store_id } = await getServerIdentity();
  if (!store_id) throw new Error("No store found");

  const { data, error } = await db.rpc("create_product_transaction_v1", {
    payload: {
      store_id,
      ...input,
    },
  });

  if (error) {
    console.error("[admin-catalog] createProductHandler RPC error:", error);
    throw new Error(error.message || "Erro atômico ao criar o produto e matriz.");
  }

  return data;
}

export const createProduct = createServerFn({ method: "POST" })
  .validator(
    z.object({
      type_id: z.string().uuid().optional().nullable(),
      title: z.string().min(1).max(300),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      description: z.string().optional().nullable(),
      short_description: z.string().optional().nullable(),
      manufacturer: z.string().optional().nullable(),
      ean: z.string().optional().nullable(),
      meta_title: z.string().optional().nullable(),
      meta_description: z.string().optional().nullable(),
      status: z.enum(["draft", "published", "archived"]).default("draft"),
      brand: z.string().optional().nullable(),
      price_cents: z.number().int().min(0),
      compare_at_cents: z.number().int().min(0).optional().nullable(),
      cost_cents: z.number().int().min(0).optional().nullable(),
      attributes: z.record(z.any()).default({}), // Dynamic fields based on type
      options: z.any().optional(),
      is_physical: z.boolean().default(true).optional(),
      weight_kg: z.number().min(0).optional().nullable(),
      width_cm: z.number().min(0).optional().nullable(),
      height_cm: z.number().min(0).optional().nullable(),
      length_cm: z.number().min(0).optional().nullable(),
      preparation_time_days: z.number().int().min(0).optional().nullable(),
      media_urls: z.array(z.string().url()).optional(),
      category_ids: z.array(z.string().uuid()).optional(),
      variants: z
        .array(
          z.object({
            sku: z.string().min(1),
            attributes: z.record(z.any()).default({}),
            price_override_cents: z.number().int().min(0).optional().nullable(),
            stock: z.number().int().min(0).default(0),
            image_url: z.string().optional().nullable(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await createProductHandler(input);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] createProduct error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao criar produto.");
    }
  });

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategoriesHandler() {
  const db = getServerClient();

  const { data, error } = await db
    .from("categories")
    .select("id, name, slug, status, sort_order, parent_id")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await requireAdmin(); // SECURITY FIX
    const data = await listCategoriesHandler();
    return data;
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[admin-catalog] listCategories error:", e);
    throw new Error("Erro ao listar categorias.");
  }
});

export async function createCategoryHandler(input: {
  name: string;
  slug: string;
  parent_id?: string | null;
  status: "active" | "inactive";
}) {
  const db = getServerClient();

  const { getServerIdentity } = await import("@/lib/identity");
  const { store_id } = await getServerIdentity();
  if (!store_id) throw new Error("No store found");
  const storeData = { id: store_id };
  if (!storeData) throw new Error("No store found");

  const { data, error } = await db
    .from("categories")
    .insert({
      store_id: storeData.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const createCategory = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1).max(100),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      parent_id: z.string().uuid().optional().nullable(),
      status: z.enum(["active", "inactive"]).default("active"),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await createCategoryHandler(input);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] createCategory error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao criar categoria.");
    }
  });

export async function getCategoryByIdHandler(id: string) {
  const db = getServerClient();
  const { data, error } = await db.from("categories").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export const getCategoryById = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await getCategoryByIdHandler(id);
      return data;
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[admin-catalog] getCategoryById error:", e);
      throw new Error("Erro ao buscar categoria.");
    }
  });

export async function updateCategoryHandler(input: {
  id: string;
  name?: string;
  slug?: string;
  parent_id?: string | null;
  status?: "active" | "inactive" | "archived";
}) {
  const db = getServerClient();
  const { id, ...updates } = input;
  const { data, error } = await db
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export const updateCategory = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .optional(),
      parent_id: z.string().uuid().optional().nullable(),
      status: z.enum(["active", "inactive", "archived"]).optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await updateCategoryHandler(input);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] updateCategory error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao atualizar categoria.");
    }
  });

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export async function listCollectionsHandler() {
  const db = getServerClient();

  const { data, error } = await db
    .from("collections")
    .select("id, name, slug, status, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

export const listCollections = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await requireAdmin(); // SECURITY FIX
    const data = await listCollectionsHandler();
    return data;
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[admin-catalog] listCollections error:", e);
    throw new Error("Erro ao listar coleções.");
  }
});

export async function createCollectionHandler(input: {
  name: string;
  slug: string;
  status: "active" | "inactive";
}) {
  const db = getServerClient();

  const { getServerIdentity } = await import("@/lib/identity");
  const { store_id } = await getServerIdentity();
  if (!store_id) throw new Error("No store found");
  const storeData = { id: store_id };
  if (!storeData) throw new Error("No store found");

  const { data, error } = await db
    .from("collections")
    .insert({
      store_id: storeData.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const createCollection = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1).max(100),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      status: z.enum(["active", "inactive"]).default("active"),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await createCollectionHandler(input);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] createCollection error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao criar coleção.");
    }
  });

export async function getCollectionByIdHandler(id: string) {
  const db = getServerClient();
  const { data, error } = await db.from("collections").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export const getCollectionById = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await getCollectionByIdHandler(id);
      return data;
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[admin-catalog] getCollectionById error:", e);
      throw new Error("Erro ao buscar coleção.");
    }
  });

export async function updateCollectionHandler(input: {
  id: string;
  name?: string;
  slug?: string;
  status?: "active" | "inactive" | "archived";
}) {
  const db = getServerClient();
  const { id, ...updates } = input;
  const { data, error } = await db
    .from("collections")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export const updateCollection = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .optional(),
      status: z.enum(["active", "inactive", "archived"]).optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await updateCollectionHandler(input);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] updateCollection error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao atualizar coleção.");
    }
  });

// ---------------------------------------------------------------------------
// Product Edit & Variants
// ---------------------------------------------------------------------------

export async function getProductByIdHandler(id: string) {
  const db = getServerClient();

  const { data, error } = await db
    .from("products")
    .select(
      `
      *,
      product_variants (*),
      product_media (*),
      product_categories (category_id),
      product_types (id, name, field_schema)
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export const getProductById = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await getProductByIdHandler(id);
      return data;
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[admin-catalog] getProductById error:", e);
      throw new Error("Erro ao buscar produto.");
    }
  });

export async function updateProductHandler(input: {
  id: string;
  title?: string;
  description?: string | null;
  short_description?: string | null;
  manufacturer?: string | null;
  ean?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  status?: "draft" | "published" | "archived";
  brand?: string | null;
  price_cents?: number;
  compare_at_cents?: number | null;
  cost_cents?: number | null;
  attributes?: Record<string, any>;
  is_physical?: boolean;
  weight_kg?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  length_cm?: number | null;
  preparation_time_days?: number | null;
  type_id?: string | null;
  category_ids?: string[];
  options?: any;
  variants?: {
    id?: string;
    sku?: string;
    attributes: Record<string, any>;
    price_cents?: number | null;
    price_override_cents?: number | null;
    stock: number;
    image_url?: string | null;
  }[];
}) {
  const db = getServerClient();
  const { getServerIdentity } = await import("@/lib/identity");
  const { store_id } = await getServerIdentity();
  if (!store_id) throw new Error("Acesso não autorizado.");

  const { id, category_ids, variants, ...updates } = input;

  // Garantir que a atualização só ocorre no tenant correto
  const { data, error } = await db
    .from("products")
    .update(updates)
    .eq("id", id)
    .eq("store_id", store_id)
    .select()
    .single();

  if (error) throw error;

  if (category_ids !== undefined) {
    await db.from("product_categories").delete().eq("product_id", id);
    if (category_ids.length > 0) {
      const catRecords = category_ids.map((cid) => ({
        product_id: id,
        category_id: cid,
      }));
      await db.from("product_categories").insert(catRecords);
    }
  }

  // Sincroniza a matriz de variantes se fornecida
  if (variants && variants.length > 0) {
    const matrix = variants.map((v) => ({
      attributes: v.attributes,
      stock: v.stock,
      // price_override_cents null = herança canônica do preço base do produto
      // nunca usar price_cents como fallback — isso quebraria a herança dinâmica
      price_override_cents: v.price_override_cents ?? null,
    }));
    await batchUpsertVariantMatrixHandler({
      product_id: id,
      matrix,
    });
  }

  return data;
}

export const updateProduct = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(300).optional(),
      description: z.string().optional().nullable(),
      short_description: z.string().optional().nullable(),
      manufacturer: z.string().optional().nullable(),
      ean: z.string().optional().nullable(),
      meta_title: z.string().optional().nullable(),
      meta_description: z.string().optional().nullable(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      brand: z.string().optional().nullable(),
      price_cents: z.number().int().min(0).optional(),
      compare_at_cents: z.number().int().min(0).optional().nullable(),
      cost_cents: z.number().int().min(0).optional().nullable(),
      attributes: z.record(z.any()).optional(),
      is_physical: z.boolean().optional(),
      weight_kg: z.number().min(0).optional().nullable(),
      width_cm: z.number().min(0).optional().nullable(),
      height_cm: z.number().min(0).optional().nullable(),
      length_cm: z.number().min(0).optional().nullable(),
      preparation_time_days: z.number().int().min(0).optional().nullable(),
      type_id: z.string().uuid().optional().nullable(),
      category_ids: z.array(z.string().uuid()).optional(),
      options: z.any().optional(),
      variants: z
        .array(
          z.object({
            id: z.string().uuid().optional(),
            sku: z.string().optional(),
            attributes: z.record(z.any()).default({}),
            price_cents: z.number().int().min(0).optional().nullable(),
            price_override_cents: z.number().int().min(0).optional().nullable(),
            stock: z.number().int().min(0).default(0),
            image_url: z.string().url().optional().nullable(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await updateProductHandler(input);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] updateProduct error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao atualizar produto.");
    }
  });

export async function upsertProductVariantHandler(input: {
  id?: string;
  product_id: string;
  sku: string;
  barcode?: string | null;
  status: "active" | "inactive" | "archived";
  price_override_cents?: number | null;
  cost_cents?: number | null;
  stock_alert_qty?: number | null;
  ean?: string | null;
  weight_kg?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  length_cm?: number | null;
  display_name?: string | null;
  attributes: Record<string, any>;
}) {
  const db = getServerClient();
  const { id, product_id, ...payload } = input;

  const query = db.from("product_variants");

  // -- CONTRACT SHIELD START --
  // Clean attributes
  const cleanAttrs: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload.attributes || {})) {
    cleanAttrs[k.trim()] = String(v).trim();
  }
  payload.attributes = cleanAttrs;

  // Get existing variants
  const { data: existingVariants, error: fetchError } = await db
    .from("product_variants")
    .select("id, attributes")
    .eq("product_id", product_id);

  if (fetchError) throw fetchError;

  const otherVariants = existingVariants.filter((v: any) => v.id !== id);

  if (otherVariants.length > 0) {
    // We intentionally allow incoming variants to have different keys than existing variants.
    // This allows the store owner to add a new option (e.g. "Material") without breaking the system.
    // Obsolete variants that lack the new dimension will be archived by batchUpsertVariantMatrixHandler.

    const incomingComboStr = Object.keys(cleanAttrs)
      .sort()
      .map((k) => `${k}=${cleanAttrs[k]}`)
      .join("|");

    for (const ov of otherVariants) {
      const ovComboStr = Object.keys(ov.attributes || {})
        .sort()
        .map((k) => `${k}=${ov.attributes[k]}`)
        .join("|");
      if (ovComboStr === incomingComboStr) {
        throw new Error(
          "Conflito de Matriz: Já existe outra variante neste produto com esta mesma combinação exata de atributos.",
        );
      }
    }
  }
  // -- CONTRACT SHIELD END --

  let result;

  if (id) {
    result = await query.update(payload).eq("id", id).select().single();
  } else {
    result = await query
      .insert({ product_id, ...payload })
      .select()
      .single();
  }

  if (result.error) throw result.error;
  return result.data;
}

export const upsertProductVariant = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      product_id: z.string().uuid(),
      sku: z.string().min(1),
      barcode: z.string().optional().nullable(),
      status: z.enum(["active", "inactive", "archived"]).default("active"),
      price_override_cents: z.number().int().min(0).optional().nullable(),
      cost_cents: z.number().int().min(0).optional().nullable(),
      stock_alert_qty: z.number().int().min(0).optional().nullable(),
      ean: z.string().optional().nullable(),
      weight_kg: z.number().min(0).optional().nullable(),
      width_cm: z.number().min(0).optional().nullable(),
      height_cm: z.number().min(0).optional().nullable(),
      length_cm: z.number().min(0).optional().nullable(),
      display_name: z.string().optional().nullable(),
      attributes: z.record(z.any()).default({}),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await upsertProductVariantHandler(input);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] upsertProductVariant error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao salvar variante.");
    }
  });
export async function batchUpsertVariantMatrixHandler(input: {
  product_id: string;
  matrix: {
    id?: string;
    sku?: string;
    attributes: Record<string, string>;
    price_override_cents?: number | null;
    stock: number;
    original_stock?: number;
    image_url?: string | null;
  }[];
}) {
  const db = getServerClient();
  const { getServerIdentity } = await import("@/lib/identity");

  // FIX: Multi-tenant security check enforcement
  const { store_id } = await getServerIdentity();
  if (!store_id) throw new Error("Acesso não autorizado.");

  const { data, error } = await db.rpc("batch_upsert_variant_matrix_v2", {
    store_id_param: store_id,
    product_id_param: input.product_id,
    matrix: input.matrix,
  });

  if (error) {
    console.error("[admin-catalog] batchUpsertVariantMatrix RPC error:", error);
    throw new Error(error.message || "Erro atômico ao atualizar matriz.");
  }

  return data;
}

export const batchUpsertVariantMatrix = createServerFn({ method: "POST" })
  .validator(
    z.object({
      product_id: z.string().uuid(),
      matrix: z.array(
        z.object({
          id: z.string().uuid().optional(),
          sku: z.string().optional(),
          attributes: z.record(z.string()),
          price_override_cents: z.number().int().min(0).optional().nullable(),
          stock: z.number().int().min(0).default(0),
          original_stock: z.number().int().min(0).optional(),
          image_url: z.string().optional().nullable(),
        }),
      ),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      return await batchUpsertVariantMatrixHandler(input);
    } catch (e: unknown) {
      console.error("[admin-catalog] batchUpsertVariantMatrix error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao salvar matriz de variações.");
    }
  });

export const updateProductMediaMetadata = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      alt: z.string().optional().nullable(),
      variant_id: z.string().uuid().optional().nullable(),
      media_type: z.enum(["image", "video"]).default("image"),
      sort_order: z.number().int().optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const db = getServerClient();
      const { id, ...updates } = data;
      const { error } = await db.from("product_media").update(updates).eq("id", id);
      if (error) throw error;
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[admin-catalog] updateProductMediaMetadata error:", e.message);
      throw new Error(e.message || "Erro ao atualizar metadados da mídia.");
    }
  });

export const reorderProductMedia = createServerFn({ method: "POST" })
  .validator(
    z.object({
      mediaOrders: z.array(
        z.object({
          id: z.string().uuid(),
          sort_order: z.number().int(),
        }),
      ),
    }),
  )
  .handler(async ({ data: { mediaOrders } }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const db = getServerClient();

      for (const item of mediaOrders) {
        const { error } = await db
          .from("product_media")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id);
        if (error) throw error;
      }

      return { status: "success" as const };
    } catch (e: any) {
      console.error("[admin-catalog] reorderProductMedia error:", e.message);
      throw new Error(e.message || "Erro ao reordenar mídias.");
    }
  });

export async function getOnboardingProgressHandler() {
  const db = getServerClient();

  // Fetch store
  const { data: store } = await db
    .from("stores")
    .select("id, name, settings")
    .limit(1)
    .maybeSingle();

  // Step 1: Store data config (is settings empty?)
  const storeDone = store ? Object.keys(store.settings ?? {}).length > 0 : false;

  // Step 2: Theme Settings / Identidade visual
  const { count: themeCount } = await db
    .from("theme_settings")
    .select("*", { count: "exact", head: true });
  const themeDone = (themeCount ?? 0) > 0;

  // Step 3: Products
  const { count: productsCount } = await db
    .from("products")
    .select("*", { count: "exact", head: true });
  const productsDone = (productsCount ?? 0) > 0;

  // Step 4: Shipping table
  const { count: shippingCount } = await db
    .from("shipping_rates")
    .select("*", { count: "exact", head: true });
  const shippingDone = (shippingCount ?? 0) > 0;

  // Step 5: Payments (Integration credentials for payment providers)
  const { count: paymentCount } = await db
    .from("integration_credentials")
    .select("*", { count: "exact", head: true })
    .in("provider", ["mercado_pago", "asaas", "custom_pix"]);
  const paymentsDone = (paymentCount ?? 0) > 0;

  // Step 6: CMS pages
  const { count: pagesCount } = await db.from("pages").select("*", { count: "exact", head: true });
  const cmsDone = (pagesCount ?? 0) > 0;

  return {
    storeDone,
    themeDone,
    productsDone,
    shippingDone,
    paymentsDone,
    cmsDone,
  };
}

export const getOnboardingProgress = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await requireAdmin(); // SECURITY FIX
    const data = await getOnboardingProgressHandler();
    return {
      status: "ok" as const,
      data,
    };
  } catch (e: any) {
    if (e.code === "supabase_unconfigured" || e.message?.includes("unconfigured")) {
      return { status: "unconfigured" as const };
    }
    console.error("[admin-catalog] getOnboardingProgress error:", e);
    throw new Error(e.message || "Erro ao carregar progresso de onboarding.");
  }
});

export async function deleteProductMediaHandler(input: { id: string; url: string }) {
  const db = getServerClient();
  const { id, url } = input;

  const { error: dbError } = await db.from("product_media").delete().eq("id", id);
  if (dbError) throw dbError;

  const pathMatches = url.match(/product-media\/(.*)$/);
  if (pathMatches && pathMatches[1]) {
    const { error: storageError } = await db.storage.from("product-media").remove([pathMatches[1]]);
    if (storageError) console.error("Storage delete error:", storageError);
  }

  return { status: "success" as const };
}

export const deleteProductMedia = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), url: z.string().url() }))
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      return await deleteProductMediaHandler(input);
    } catch (e: any) {
      throw new Error(e.message || "Erro ao deletar mídia.");
    }
  });

export async function addProductMediaLinkHandler(input: {
  product_id: string;
  url: string;
  variant_id?: string | null;
}) {
  const db = getServerClient();
  const { product_id, url, variant_id } = input;

  const { data, error } = await db
    .from("product_media")
    .insert({
      product_id,
      url,
      variant_id: variant_id || null,
      sort_order: 99,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const addProductMediaLink = createServerFn({ method: "POST" })
  .validator(
    z.object({
      product_id: z.string().uuid(),
      url: z.string().url(),
      variant_id: z.string().uuid().optional().nullable(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await addProductMediaLinkHandler(input);
      return data;
    } catch (e: any) {
      throw new Error(e.message || "Erro ao vincular mídia");
    }
  });

export async function toggleProductCollectionHandler(input: {
  productId: string;
  collectionId?: string;
  collectionSlug?: string;
  add?: boolean;
}) {
  const db = getServerClient();
  const { productId, collectionId, collectionSlug, add = true } = input;

  let targetCollectionId = collectionId;

  if (!targetCollectionId && collectionSlug) {
    const { data: col, error: colErr } = await db
      .from("collections")
      .select("id")
      .eq("slug", collectionSlug)
      .single();

    if (colErr || !col) {
      throw new Error("Coleção não encontrada com o slug fornecido");
    }
    targetCollectionId = col.id;
  }

  if (!targetCollectionId) {
    throw new Error("Identificador de coleção (id ou slug) é obrigatório");
  }

  if (add) {
    const { error } = await db.from("product_collections").upsert(
      {
        product_id: productId,
        collection_id: targetCollectionId,
      },
      { onConflict: "product_id,collection_id" },
    );
    if (error) throw error;
  } else {
    const { error } = await db
      .from("product_collections")
      .delete()
      .eq("product_id", productId)
      .eq("collection_id", targetCollectionId);
    if (error) throw error;
  }

  return { status: "success" as const };
}

export const toggleProductCollection = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().uuid(),
      collectionId: z.string().uuid().optional(),
      collectionSlug: z.string().optional(),
      add: z.boolean().optional(),
    }),
  )
  .handler(
    async ({
      data: input,
    }): Promise<{ status: "success" } | { status: "error"; message: string }> => {
      try {
        await requireAdmin(); // SECURITY FIX
        return await toggleProductCollectionHandler(input);
      } catch (e: any) {
        console.error("[admin-catalog] toggleProductCollection error:", e);
        return { status: "error" as const, message: e.message || "Erro ao vincular coleção" };
      }
    },
  );

// ---------------------------------------------------------------------------
// Ações de Gestão em Lote e Duplicação de Produtos
// ---------------------------------------------------------------------------

export async function duplicateProductHandler(productId: string) {
  const db = getServerClient();
  const { getServerIdentity } = await import("@/lib/identity");
  const { store_id } = await getServerIdentity();
  if (!store_id) throw new Error("Acesso não autorizado.");

  const { data: original, error } = await db
    .from("products")
    .select(
      `
        *,
        product_variants (*),
        product_media (*),
        product_categories (category_id)
      `,
    )
    .eq("id", productId)
    .eq("store_id", store_id)
    .single();

  if (error || !original) throw new Error("Produto original não encontrado para duplicação");

  const timestamp = Date.now();
  const newTitle = `${original.title} (Cópia)`;
  const newSlug = `${original.slug}-copia-${timestamp}`;

  const {
    id: _,
    created_at: __,
    updated_at: ___,
    product_variants,
    product_media,
    product_categories,
    ...restProduct
  } = original;

  const { data: duplicate, error: dupError } = await db
    .from("products")
    .insert({
      ...restProduct,
      title: newTitle,
      slug: newSlug,
      status: "draft",
    })
    .select()
    .single();

  if (dupError) throw dupError;

  if (original.product_categories && original.product_categories.length > 0) {
    const catRecords = original.product_categories.map((c: any) => ({
      product_id: duplicate.id,
      category_id: c.category_id,
    }));
    await db.from("product_categories").insert(catRecords);
  }

  if (original.product_media && original.product_media.length > 0) {
    const mediaRecords = original.product_media.map((m: any) => ({
      product_id: duplicate.id,
      url: m.url,
      alt: m.alt,
      sort_order: m.sort_order,
    }));
    await db.from("product_media").insert(mediaRecords);
  }

  if (original.product_variants && original.product_variants.length > 0) {
    for (const v of original.product_variants) {
      await db.from("product_variants").insert({
        product_id: duplicate.id,
        sku: `${v.sku}-CP${timestamp.toString().slice(-4)}`,
        price_override_cents: v.price_override_cents,
        attributes: v.attributes,
        stock_on_hand: 0,
      });
    }
  }

  return duplicate;
}

export const duplicateProduct = createServerFn({ method: "POST" })
  .validator(z.object({ productId: z.string().uuid() }))
  .handler(async ({ data: { productId } }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await duplicateProductHandler(productId);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] duplicateProduct error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao duplicar produto.");
    }
  });

export async function toggleProductStatusHandler(input: {
  productId: string;
  status: "draft" | "published" | "archived";
}) {
  const db = getServerClient();
  const { getServerIdentity } = await import("@/lib/identity");
  const { store_id } = await getServerIdentity();
  if (!store_id) throw new Error("Acesso não autorizado.");

  const { data, error } = await db
    .from("products")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.productId)
    .eq("store_id", store_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const toggleProductStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().uuid(),
      status: z.enum(["draft", "published", "archived"]),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const data = await toggleProductStatusHandler(input);
      return data;
    } catch (e: unknown) {
      console.error("[admin-catalog] toggleProductStatus error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao alterar status.");
    }
  });

export async function bulkUpdateProductStatusHandler(input: {
  productIds: string[];
  action: "draft" | "published" | "archived" | "delete";
}) {
  const db = getServerClient();
  if (!input.productIds || input.productIds.length === 0) {
    return { count: 0 };
  }

  if (input.action === "delete") {
    const { error } = await db.from("products").delete().in("id", input.productIds);
    if (error) throw error;
    return { count: input.productIds.length };
  }

  const { error } = await db
    .from("products")
    .update({ status: input.action })
    .in("id", input.productIds);

  if (error) throw error;
  return { count: input.productIds.length };
}

export const bulkUpdateProductStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productIds: z.array(z.string().uuid()),
      action: z.enum(["draft", "published", "archived", "delete"]),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin(); // SECURITY FIX
      const res = await bulkUpdateProductStatusHandler(input);
      return res;
    } catch (e: unknown) {
      console.error("[admin-catalog] bulkUpdateProductStatus error:", e);
      throw new Error(e instanceof Error ? e.message : "Erro ao executar ação em lote.");
    }
  });

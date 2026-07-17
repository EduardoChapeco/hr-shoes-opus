/**
 * Admin Catalog server functions — Hr Shoes Commerce
 *
 * BFF boundary for the Admin Panel. Handles CRUD operations for ProductTypes,
 * Categories, Products, and Variants.
 * Relies on RLS for authorization (user must be staff).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
    const data = await listProductTypesHandler();
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[admin-catalog] listProductTypes error:", e);
    return { status: "error" as const, message: "Erro ao listar tipos de produto." };
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
      const data = await createProductTypeHandler(input);
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[admin-catalog] createProductType error:", e);
      return {
        status: "error" as const,
        message: e instanceof Error ? e.message : "Erro ao criar tipo de produto.",
      };
    }
  });

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function listAdminProductsHandler() {
  const db = getServerClient();

  const { data, error } = await db
    .from("products")
    .select(
      `
        id, title, slug, status, price_cents, compare_at_cents, brand,
        product_types (id, name),
        product_media (url, alt, sort_order)
      `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export const listAdminProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await listAdminProductsHandler();
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[admin-catalog] listAdminProducts error:", e);
    return { status: "error" as const, message: "Erro ao listar produtos." };
  }
});

export async function createProductHandler(input: {
  type_id?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  status: "draft" | "published" | "archived";
  brand?: string | null;
  price_cents: number;
  compare_at_cents?: number | null;
  cost_cents?: number | null;
  attributes: Record<string, any>;
  weight_grams?: number | null;
  media_urls?: string[];
  category_ids?: string[];
  variants?: {
    sku: string;
    attributes: Record<string, any>;
    price_cents?: number;
    stock: number;
  }[];
}) {
  const db = getServerClient();

  const { data: storeData } = await db.from("stores").select("id").limit(1).single();
  if (!storeData) throw new Error("No store found");

  const { media_urls, variants, category_ids, ...productInput } = input;

  const { data, error } = await db
    .from("products")
    .insert({
      store_id: storeData.id,
      ...productInput,
    })
    .select()
    .single();

  if (error) throw error;

  // Create Categories Mapping
  if (category_ids && category_ids.length > 0) {
    const catRecords = category_ids.map((cid) => ({
      product_id: data.id,
      category_id: cid,
    }));
    await db.from("product_categories").insert(catRecords);
  }

  // Create Variants
  if (variants && variants.length > 0) {
    for (const v of variants) {
      const { data: variantData, error: variantError } = await db
        .from("product_variants")
        .insert({
          product_id: data.id,
          sku: v.sku,
          price_override_cents: v.price_cents,
          attributes: v.attributes,
          stock_on_hand: v.stock, // Allow initial stock bypass for creation
        })
        .select()
        .single();

      if (variantError) throw variantError;

      if (v.stock > 0) {
        await db.from("stock_movements").insert({
          variant_id: variantData.id,
          store_id: storeData.id,
          movement_type: "adjustment",
          qty: v.stock,
          note: "Estoque Inicial (Criação)",
        });
      }
    }
  } else {
    // Create a default variant if none provided
    const { error: variantError } = await db.from("product_variants").insert({
      product_id: data.id,
      sku: `${input.slug}-01`,
      price_override_cents: input.price_cents,
      attributes: input.attributes,
      stock_on_hand: 0,
    });

    if (variantError) throw variantError;
  }

  // Insert media if provided
  if (media_urls && media_urls.length > 0) {
    const mediaRecords = media_urls.map((url, idx) => ({
      product_id: data.id,
      url,
      sort_order: idx,
    }));
    await db.from("product_media").insert(mediaRecords);
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
      status: z.enum(["draft", "published", "archived"]).default("draft"),
      brand: z.string().optional().nullable(),
      price_cents: z.number().int().min(0),
      compare_at_cents: z.number().int().min(0).optional().nullable(),
      cost_cents: z.number().int().min(0).optional().nullable(),
      attributes: z.record(z.any()).default({}), // Dynamic fields based on type
      weight_grams: z.number().int().min(0).optional().nullable(),
      media_urls: z.array(z.string().url()).optional(),
      category_ids: z.array(z.string().uuid()).optional(),
      variants: z
        .array(
          z.object({
            sku: z.string().min(1),
            attributes: z.record(z.any()).default({}),
            price_cents: z.number().int().min(0).optional(),
            stock: z.number().int().min(0).default(0),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const data = await createProductHandler(input);
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[admin-catalog] createProduct error:", e);
      return {
        status: "error" as const,
        message: e instanceof Error ? e.message : "Erro ao criar produto.",
      };
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
    const data = await listCategoriesHandler();
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[admin-catalog] listCategories error:", e);
    return { status: "error" as const, message: "Erro ao listar categorias." };
  }
});

export async function createCategoryHandler(input: {
  name: string;
  slug: string;
  parent_id?: string | null;
  status: "active" | "inactive";
}) {
  const db = getServerClient();

  const { data: storeData } = await db.from("stores").select("id").limit(1).single();
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
      const data = await createCategoryHandler(input);
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[admin-catalog] createCategory error:", e);
      return {
        status: "error" as const,
        message: e instanceof Error ? e.message : "Erro ao criar categoria.",
      };
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
    const data = await listCollectionsHandler();
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[admin-catalog] listCollections error:", e);
    return { status: "error" as const, message: "Erro ao listar coleções." };
  }
});

export async function createCollectionHandler(input: {
  name: string;
  slug: string;
  status: "active" | "inactive";
}) {
  const db = getServerClient();

  const { data: storeData } = await db.from("stores").select("id").limit(1).single();
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
      const data = await createCollectionHandler(input);
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[admin-catalog] createCollection error:", e);
      return {
        status: "error" as const,
        message: e instanceof Error ? e.message : "Erro ao criar coleção.",
      };
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
      product_categories (category_id)
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export const getProductById = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      const data = await getProductByIdHandler(id);
      return { status: "ok" as const, data };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
      console.error("[admin-catalog] getProductById error:", e);
      return { status: "error" as const, message: "Erro ao buscar produto." };
    }
  });

export async function updateProductHandler(input: {
  id: string;
  title?: string;
  description?: string | null;
  status?: "draft" | "published" | "archived";
  brand?: string | null;
  price_cents?: number;
  compare_at_cents?: number | null;
  cost_cents?: number | null;
  attributes?: Record<string, any>;
  weight_grams?: number | null;
  type_id?: string | null;
  category_ids?: string[];
}) {
  const db = getServerClient();
  const { id, category_ids, ...updates } = input;

  const { data, error } = await db.from("products").update(updates).eq("id", id).select().single();

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

  return data;
}

export const updateProduct = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(300).optional(),
      description: z.string().optional().nullable(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      brand: z.string().optional().nullable(),
      price_cents: z.number().int().min(0).optional(),
      compare_at_cents: z.number().int().min(0).optional().nullable(),
      cost_cents: z.number().int().min(0).optional().nullable(),
      attributes: z.record(z.any()).optional(),
      weight_grams: z.number().int().min(0).optional().nullable(),
      type_id: z.string().uuid().optional().nullable(),
      category_ids: z.array(z.string().uuid()).optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const data = await updateProductHandler(input);
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[admin-catalog] updateProduct error:", e);
      return {
        status: "error" as const,
        message: e instanceof Error ? e.message : "Erro ao atualizar produto.",
      };
    }
  });

export async function upsertProductVariantHandler(input: {
  id?: string;
  product_id: string;
  sku: string;
  barcode?: string | null;
  status: "active" | "inactive" | "archived";
  price_override_cents?: number | null;
  attributes: Record<string, any>;
}) {
  const db = getServerClient();
  const { id, product_id, sku, barcode, status, price_override_cents, attributes } = input;

  const payload = {
    product_id,
    sku,
    barcode,
    status,
    price_override_cents,
    attributes,
  };

  const query = db.from("product_variants");
  let result;

  if (id) {
    result = await query.update(payload).eq("id", id).select().single();
  } else {
    result = await query.insert(payload).select().single();
  }

  if (result.error) throw result.error;
  return result.data;
}

export const upsertProductVariant = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(), // if missing, create new
      product_id: z.string().uuid(),
      sku: z.string().min(1),
      barcode: z.string().optional().nullable(),
      status: z.enum(["active", "inactive", "archived"]).default("active"),
      price_override_cents: z.number().int().min(0).optional().nullable(),
      attributes: z.record(z.any()).default({}), // e.g., { "size": "39", "color": "Preto" }
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const data = await upsertProductVariantHandler(input);
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[admin-catalog] upsertProductVariant error:", e);
      return {
        status: "error" as const,
        message: e instanceof Error ? e.message : "Erro ao salvar variante.",
      };
    }
  });

export const uploadProductMedia = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fileName: z.string(),
      fileBase64: z.string(),
    }),
  )
  .handler(async ({ data: { fileName, fileBase64 } }) => {
    try {
      const db = getServerClient();

      const buffer = Buffer.from(fileBase64, "base64");
      const fileExt = fileName.split(".").pop();
      const path = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await db.storage.from("product-media").upload(path, buffer, {
        contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
        upsert: false,
      });

      if (error) throw new Error(error.message);

      const publicUrl = db.storage.from("product-media").getPublicUrl(data.path).data.publicUrl;
      return { status: "success" as const, url: publicUrl };
    } catch (e: any) {
      console.error("[admin-catalog] uploadProductMedia error:", e.message);
      return { status: "error" as const, message: e.message || "Erro ao realizar upload." };
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
    return {
      status: "error" as const,
      message: e.message || "Erro ao carregar progresso de onboarding.",
    };
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
      return await deleteProductMediaHandler(input);
    } catch (e: any) {
      return { status: "error" as const, message: e.message || "Erro ao deletar mídia." };
    }
  });

export async function addProductMediaLinkHandler(input: { product_id: string; url: string }) {
  const db = getServerClient();
  const { product_id, url } = input;

  const { data, error } = await db
    .from("product_media")
    .insert({
      product_id,
      url,
      sort_order: 99,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const addProductMediaLink = createServerFn({ method: "POST" })
  .validator(z.object({ product_id: z.string().uuid(), url: z.string().url() }))
  .handler(async ({ data: input }) => {
    try {
      const data = await addProductMediaLinkHandler(input);
      return { status: "success" as const, data };
    } catch (e: any) {
      return { status: "error" as const, message: e.message || "Erro ao vincular mídia" };
    }
  });

export const toggleProductCollection = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().uuid(),
      collectionId: z.string().uuid().optional(),
      collectionSlug: z.string().optional(),
      add: z.boolean().optional(),
    }),
  )
  .handler(async (): Promise<{ status: "success" } | { status: "error"; message: string }> => {
    return { status: "success" as const };
  });

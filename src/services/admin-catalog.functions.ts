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

export const listProductTypes = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

    // RLS will enforce store isolation
    const { data, error } = await db
      .from("product_types")
      .select("id, name, slug, field_schema, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[admin-catalog] listProductTypes error:", e);
    return { status: "error" as const, message: "Erro ao listar tipos de produto." };
  }
});

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

export const listAdminProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
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

    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[admin-catalog] listAdminProducts error:", e);
    return { status: "error" as const, message: "Erro ao listar produtos." };
  }
});

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
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { data: storeData } = await db.from("stores").select("id").limit(1).single();
      if (!storeData) throw new Error("No store found");

      const { media_urls, ...productInput } = input;

      const { data, error } = await db
        .from("products")
        .insert({
          store_id: storeData.id,
          ...productInput,
        })
        .select()
        .single();

      if (error) throw error;

      // Create a default variant
      const { data: variant, error: variantError } = await db
        .from("product_variants")
        .insert({
          product_id: data.id,
          sku: `${input.slug}-01`,
          price_cents: input.price_cents,
          compare_at_price_cents: input.compare_at_cents,
          attributes: input.attributes,
        })
        .select()
        .single();

      if (variantError) throw variantError;

      // Insert media if provided
      if (media_urls && media_urls.length > 0) {
        const mediaRecords = media_urls.map((url, idx) => ({
          product_id: data.id,
          url,
          sort_order: idx,
        }));
        await db.from("product_media").insert(mediaRecords);
      }

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

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

    const { data, error } = await db
      .from("categories")
      .select("id, name, slug, status, sort_order, parent_id")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[admin-catalog] listCategories error:", e);
    return { status: "error" as const, message: "Erro ao listar categorias." };
  }
});

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

export const listCollections = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

    const { data, error } = await db
      .from("collections")
      .select("id, name, slug, status, sort_order")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[admin-catalog] listCollections error:", e);
    return { status: "error" as const, message: "Erro ao listar coleções." };
  }
});

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

export const getProductById = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      const db = getServerClient();

      const { data, error } = await db
        .from("products")
        .select(
          `
          *,
          product_variants (*),
          product_media (*)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      return { status: "ok" as const, data };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
      console.error("[admin-catalog] getProductById error:", e);
      return { status: "error" as const, message: "Erro ao buscar produto." };
    }
  });

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
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();
      const { id, ...updates } = input;

      const { data, error } = await db
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[admin-catalog] updateProduct error:", e);
      return {
        status: "error" as const,
        message: e instanceof Error ? e.message : "Erro ao atualizar produto.",
      };
    }
  });

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

      let query = db.from("product_variants");
      let result;

      if (id) {
        result = await query.update(payload).eq("id", id).select().single();
      } else {
        result = await query.insert(payload).select().single();
      }

      if (result.error) throw result.error;

      return { status: "success" as const, data: result.data };
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

export const getOnboardingProgress = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

    // Fetch store
    const { data: store } = await db.from("stores").select("id, name, settings").limit(1).maybeSingle();

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
    const { count: pagesCount } = await db
      .from("pages")
      .select("*", { count: "exact", head: true });
    const cmsDone = (pagesCount ?? 0) > 0;

    return {
      status: "ok" as const,
      data: {
        storeDone,
        themeDone,
        productsDone,
        shippingDone,
        paymentsDone,
        cmsDone,
      },
    };
  } catch (e: any) {
    console.error("[admin-catalog] getOnboardingProgress error:", e);
    return {
      status: "error" as const,
      message: e.message || "Erro ao carregar progresso de onboarding.",
    };
  }
});



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
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { data: storeData } = await db.from("stores").select("id").limit(1).single();
      if (!storeData) throw new Error("No store found");

      const { data, error } = await db
        .from("products")
        .insert({
          store_id: storeData.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;

      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[admin-catalog] createProduct error:", e);
      return {
        status: "error" as const,
        message: e instanceof Error ? e.message : "Erro ao criar produto.",
      };
    }
  });

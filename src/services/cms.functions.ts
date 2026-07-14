/**
 * CMS server functions — Hr Shoes Commerce
 *
 * BFF boundary for Pages and Sections management.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------------------

export const listAdminPages = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const { data, error } = await db
      .from("pages")
      .select("id, title, slug, status, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[cms.functions] listAdminPages error:", e);
    return { status: "error" as const, message: "Erro ao listar páginas." };
  }
});

export const getAdminPageDetails = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { data: page, error: pageError } = await db
        .from("pages")
        .select("*")
        .eq("id", input.id)
        .single();

      if (pageError) throw pageError;

      const { data: sections, error: sectionsError } = await db
        .from("page_sections")
        .select("*")
        .eq("page_id", input.id)
        .order("sort_order", { ascending: true });

      if (sectionsError) throw sectionsError;

      return { status: "ok" as const, data: { ...page, sections } };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
      console.error("[cms.functions] getAdminPageDetails error:", e);
      return { status: "error" as const, message: "Erro ao carregar detalhes da página." };
    }
  });

export const createPage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(1).max(200),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      status: z.enum(["draft", "published", "archived"]).default("draft"),
      seo_title: z.string().optional().nullable(),
      seo_description: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { data: storeData } = await db.from("stores").select("id").limit(1).single();
      if (!storeData) throw new Error("No store found");

      const { data, error } = await db
        .from("pages")
        .insert({
          store_id: storeData.id,
          title: input.title,
          slug: input.slug,
          status: input.status,
          seo_title: input.seo_title,
          seo_description: input.seo_description,
        })
        .select()
        .single();

      if (error) throw error;
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[cms.functions] createPage error:", e);
      return { status: "error" as const, message: e instanceof Error ? e.message : "Erro." };
    }
  });

export const savePageSections = createServerFn({ method: "POST" })
  .validator(
    z.object({
      page_id: z.string().uuid(),
      sections: z.array(
        z.object({
          id: z.string().uuid().optional(),
          section_type: z.enum(["hero", "text", "product_grid", "image", "spacer"]),
          content: z.record(z.unknown()),
          sort_order: z.number().int(),
        }),
      ),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      // Delete existing sections not in the payload
      const sectionIds = input.sections.map((s) => s.id).filter(Boolean);
      let deleteQuery = db.from("page_sections").delete().eq("page_id", input.page_id);
      if (sectionIds.length > 0) {
        deleteQuery = deleteQuery.not("id", "in", `(${sectionIds.join(",")})`);
      }
      await deleteQuery;

      // Upsert sections
      for (const section of input.sections) {
        const payload = {
          page_id: input.page_id,
          section_type: section.section_type,
          content: section.content,
          sort_order: section.sort_order,
        };

        if (section.id) {
          await db.from("page_sections").update(payload).eq("id", section.id);
        } else {
          await db.from("page_sections").insert(payload);
        }
      }

      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[cms.functions] savePageSections error:", e);
      return { status: "error" as const, message: "Erro ao salvar seções." };
    }
  });

// ---------------------------------------------------------------------------
// Storefront Read (Public)
// ---------------------------------------------------------------------------

export const getPublicPageBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { data: storeData } = await db.from("stores").select("id").limit(1).single();
      if (!storeData) return { status: "unconfigured" as const, reason: "Sem loja configurada" };

      const { data: page, error: pageError } = await db
        .from("pages")
        .select("id, title, seo_title, seo_description")
        .eq("store_id", storeData.id)
        .eq("slug", input.slug)
        .eq("status", "published")
        .single();

      if (pageError || !page) return { status: "not_found" as const };

      const { data: sections, error: sectionsError } = await db
        .from("page_sections")
        .select("id, section_type, content, sort_order")
        .eq("page_id", page.id)
        .order("sort_order", { ascending: true });

      if (sectionsError) throw sectionsError;

      return { status: "ok" as const, data: { ...page, sections } };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError)
        return { status: "unconfigured" as const, reason: "Sem banco configurado" };
      console.error("[cms.functions] getPublicPageBySlug error:", e);
      return { status: "error" as const, message: "Erro inesperado ao carregar página." };
    }
  });

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

export async function listAdminPagesHandler() {
  const db = getServerClient();
  const { data, error } = await db
    .from("pages")
    .select("id, title, slug, status, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export const listAdminPages = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await listAdminPagesHandler();
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

      const { getServerIdentity } = await import("@/lib/identity");
      const { store_id } = await getServerIdentity();
      if (!store_id) throw new Error("No store found");
      const storeData = { id: store_id };
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

export const deletePage = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      // First delete associated sections
      await db.from("page_sections").delete().eq("page_id", input.id);

      // Then delete page
      const { error } = await db.from("pages").delete().eq("id", input.id);
      if (error) throw error;

      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[cms.functions] deletePage error:", e);
      return { status: "error" as const, message: "Erro ao excluir página." };
    }
  });

export const savePageSections = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pageId: z.string().uuid(),
      sections: z.array(
        z.object({
          id: z.string().uuid().optional(),
          section_type: z.string(),
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
      let deleteQuery = db.from("page_sections").delete().eq("page_id", input.pageId);
      if (sectionIds.length > 0) {
        deleteQuery = deleteQuery.not("id", "in", `(${sectionIds.join(",")})`);
      }
      await deleteQuery;

      // Upsert sections
      for (const section of input.sections) {
        const payload = {
          page_id: input.pageId,
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

      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const storeData = storeId ? { id: storeId } : null;
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
        return {
          status: "unconfigured" as const,
          reason: "Este conteúdo institucional está sendo atualizado.",
        };
      console.error("[cms.functions] getPublicPageBySlug error:", e);
      return { status: "error" as const, message: "Erro inesperado ao carregar página." };
    }
  });

export const getPublicStoreSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { resolveTenantStoreId } = await import("@/lib/tenant");
    const storeId = await resolveTenantStoreId();
    if (!storeId) return { status: "not_found" as const };

    const db = getServerClient();
    const { data: store, error } = await db
      .from("stores")
      .select(
        "id, name, slug, email, phone, cnpj, address, city, state, zip_code, description, seo_title, seo_description, seo_keywords, settings",
      )
      .eq("id", storeId)
      .single();
    if (error || !store) return { status: "not_found" as const };
    
    // Map settings to root level for convenience
    const logoUrl = store.settings?.logoUrl;
    const faviconUrl = store.settings?.faviconUrl;
    
    return { status: "ok" as const, data: { ...store, logoUrl, faviconUrl } };
  } catch {
    return { status: "error" as const, message: "Erro ao carregar dados da loja." };
  }
});

// ---------------------------------------------------------------------------
// Theme Settings
// ---------------------------------------------------------------------------

export const getThemeSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const storeData = storeId ? { id: storeId } : null;
    if (!storeData) throw new Error("No store found");

    const { data, error } = await db
      .from("theme_settings")
      .select("*")
      .eq("store_id", storeData.id)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 is not found

    if (!data) {
      // Create default if it doesn't exist
      const { data: newData, error: insertError } = await db
        .from("theme_settings")
        .insert({ store_id: storeData.id })
        .select()
        .single();

      if (insertError) throw insertError;
      return { status: "ok" as const, data: newData };
    }

    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[cms.functions] getThemeSettings error:", e);
    return { status: "error" as const, message: "Erro ao buscar tema." };
  }
});

export const updateThemeSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      font_heading: z.string().min(1),
      font_body: z.string().min(1),
      border_radius: z.string().min(1),
      logo_url: z.string().url().optional().nullable(),
      favicon_url: z.string().url().optional().nullable(),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { getServerIdentity } = await import("@/lib/identity");
      const { store_id } = await getServerIdentity();
      if (!store_id) throw new Error("No store found");
      const storeData = { id: store_id };
      if (!storeData) throw new Error("No store found");

      const { data, error } = await db
        .from("theme_settings")
        .update(input)
        .eq("store_id", storeData.id)
        .select()
        .single();

      if (error) throw error;
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[cms.functions] updateThemeSettings error:", e);
      return { status: "error" as const, message: "Erro ao atualizar tema." };
    }
  });

// ---------------------------------------------------------------------------
// Navigation Menus
// ---------------------------------------------------------------------------

export const getNavigationMenus = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const storeData = storeId ? { id: storeId } : null;
    if (!storeData) throw new Error("No store found");

    const { data, error } = await db
      .from("navigation_menus")
      .select("*")
      .eq("store_id", storeData.id)
      .order("handle", { ascending: true });

    if (error) throw error;
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[cms.functions] getNavigationMenus error:", e);
    return { status: "error" as const, message: "Erro ao buscar menus de navegação." };
  }
});

export const upsertNavigationMenu = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      handle: z.string().regex(/^[a-z0-9-]+$/),
      name: z.string().min(1),
      items: z.array(z.any()), // array of link objects
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { getServerIdentity } = await import("@/lib/identity");
      const { store_id } = await getServerIdentity();
      if (!store_id) throw new Error("No store found");
      const storeData = { id: store_id };
      if (!storeData) throw new Error("No store found");

      const payload = {
        store_id: storeData.id,
        handle: input.handle,
        name: input.name,
        items: input.items,
      };

      const query = db.from("navigation_menus");
      let result;

      if (input.id) {
        result = await query.update(payload).eq("id", input.id).select().single();
      } else {
        result = await query.insert(payload).select().single();
      }

      if (result.error) throw result.error;
      return { status: "success" as const, data: result.data };
    } catch (e: unknown) {
      console.error("[cms.functions] upsertNavigationMenu error:", e);
      return { status: "error" as const, message: "Erro ao salvar menu de navegação." };
    }
  });

// ---------------------------------------------------------------------------
// Reviews (Avaliações)
// ---------------------------------------------------------------------------

export const listReviews = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

    // Join with products and users to get display names
    const { data, error } = await db
      .from("reviews")
      .select(
        `
        id, rating, comment, status, created_at,
        products (title),
        users:user_id (id)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[cms.functions] listReviews error:", e);
    return { status: "error" as const, message: "Erro ao listar avaliações." };
  }
});

export const updateReviewStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "approved", "rejected"]),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { data, error } = await db
        .from("reviews")
        .update({ status: input.status })
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw error;
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[cms.functions] updateReviewStatus error:", e);
      return { status: "error" as const, message: "Erro ao atualizar avaliação." };
    }
  });

export const createProductReview = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().min(2).max(1000),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { data: { user }, error: authError } = await db.auth.getUser();
      if (authError || !user) {
        throw new Error("Você precisa estar logado para fazer uma avaliação.");
      }

      const { data: prod, error: prodError } = await db
        .from("products")
        .select("store_id")
        .eq("id", input.productId)
        .single();
      if (prodError || !prod) throw new Error("Produto não encontrado.");

      const { data, error } = await db
        .from("reviews")
        .insert({
          store_id: prod.store_id,
          product_id: input.productId,
          user_id: user.id,
          rating: input.rating,
          comment: input.comment,
          status: "approved",
        })
        .select()
        .single();

      if (error) throw error;
      return { status: "success" as const, data };
    } catch (e: any) {
      console.error("[cms.functions] createProductReview error:", e.message || e);
      return { status: "error" as const, message: e.message || "Erro ao enviar avaliação." };
    }
  });

// ---------------------------------------------------------------------------
// Link-in-Bio
// ---------------------------------------------------------------------------

export const getLinkInBio = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const storeData = storeId ? { id: storeId } : null;
    if (!storeData) throw new Error("No store found");

    const { data, error } = await db
      .from("link_in_bio")
      .select("*")
      .eq("store_id", storeData.id)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 is not found

    if (!data) {
      // Create default if it doesn't exist
      const { data: newData, error: insertError } = await db
        .from("link_in_bio")
        .insert({ store_id: storeData.id })
        .select()
        .single();

      if (insertError) throw insertError;
      return { status: "ok" as const, data: newData };
    }

    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[cms.functions] getLinkInBio error:", e);
    return { status: "error" as const, message: "Erro ao buscar Link da Bio." };
  }
});

export const upsertLinkInBio = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional().nullable(),
      avatar_url: z.string().optional().nullable(),
      links: z.array(z.any()), // array of link objects
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { getServerIdentity } = await import("@/lib/identity");
      const { store_id } = await getServerIdentity();
      if (!store_id) throw new Error("No store found");
      const storeData = { id: store_id };
      if (!storeData) throw new Error("No store found");

      const { data, error } = await db
        .from("link_in_bio")
        .update(input)
        .eq("store_id", storeData.id)
        .select()
        .single();

      if (error) throw error;
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[cms.functions] upsertLinkInBio error:", e);
      return { status: "error" as const, message: "Erro ao atualizar Link da Bio." };
    }
  });

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const listAdminStories = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

      const { getServerIdentity } = await import("@/lib/identity");
      const { store_id } = await getServerIdentity();
      if (!store_id) throw new Error("No store found");
      const storeData = { id: store_id };
    if (!storeData) throw new Error("No store found");

    const { data, error } = await db
      .from("stories")
      .select("*")
      .eq("store_id", storeData.id)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[cms.functions] listAdminStories error:", e);
    return { status: "error" as const, message: "Erro ao listar stories." };
  }
});

export const upsertStory = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      media_url: z.string().url(),
      link_url: z.string().optional().nullable(),
      status: z.enum(["active", "inactive", "archived"]).default("active"),
      sort_order: z.number().int().default(0),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { getServerIdentity } = await import("@/lib/identity");
      const { store_id } = await getServerIdentity();
      if (!store_id) throw new Error("No store found");
      const storeData = { id: store_id };
      if (!storeData) throw new Error("No store found");

      const payload = {
        store_id: storeData.id,
        media_url: input.media_url,
        link_url: input.link_url,
        status: input.status,
        sort_order: input.sort_order,
      };

      const query = db.from("stories");
      let result;

      if (input.id) {
        result = await query.update(payload).eq("id", input.id).select().single();
      } else {
        result = await query.insert(payload).select().single();
      }

      if (result.error) throw result.error;
      return { status: "success" as const, data: result.data };
    } catch (e: unknown) {
      console.error("[cms.functions] upsertStory error:", e);
      return { status: "error" as const, message: "Erro ao salvar story." };
    }
  });

export const deleteStory = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      const db = getServerClient();

      const { error } = await db.from("stories").delete().eq("id", id);
      if (error) throw error;

      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[cms.functions] deleteStory error:", e);
      return { status: "error" as const, message: "Erro ao excluir story." };
    }
  });

export const listPublicStories = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const storeData = storeId ? { id: storeId } : null;
    if (!storeData) throw new Error("No store found");

    const { data, error } = await db
      .from("stories")
      .select("*")
      .eq("store_id", storeData.id)
      .eq("status", "active")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return { status: "ok" as const, data };
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[cms.functions] listPublicStories error:", e);
    return { status: "error" as const, message: "Erro ao listar stories." };
  }
});

export const getPageBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data: { slug } }) => {
    try {
      const db = getServerClient();

      // Get the first store id
      const { resolveTenantStoreId } = await import("@/lib/tenant");
      const storeId = await resolveTenantStoreId();
      const store = storeId ? { id: storeId } : null;
      if (!store) return { status: "error" as const, message: "Loja não encontrada." };

      const { data: page, error } = await db
        .from("pages")
        .select(
          `
          id, title, slug, seo_title, seo_description, updated_at,
          sections:page_sections(
            id, section_type, content, sort_order
          )
        `,
        )
        .eq("store_id", store.id)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) {
        if (error.code === "PGRST116") return { status: "not_found" as const };
        throw error;
      }

      return { status: "success" as const, data: page };
    } catch (e: unknown) {
      console.error("[cms.functions] getPageBySlug error:", e);
      return { status: "error" as const, message: "Erro ao carregar página." };
    }
  });
export const createReview = createServerFn({ method: "POST" })
  .validator(z.object({ productId: z.string().uuid(), rating: z.number().min(1).max(5), comment: z.string().optional() }))
  .handler(async ({ data: { productId, rating, comment } }) => {
    try {
      const ssrClient = getServerClient();
      const { data: { user } } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: product } = await ssrClient.from("products").select("store_id").eq("id", productId).single();
      if (!product) throw new Error("Produto não encontrado.");

      const { error } = await ssrClient.from("reviews").insert({
        store_id: product.store_id,
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment || null,
        status: "pending"
      });

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[cms.functions] createReview:", e);
      return { status: "error" as const, message: e.message || "Erro ao enviar avaliação." };
    }
  });


export const createManualReview = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().uuid(),
      rating: z.number().min(1).max(5),
      comment: z.string().max(1000).optional(),
      reviewerName: z.string().min(2),
    })
  )
  .handler(async ({ data: { productId, rating, comment, reviewerName } }) => {
    try {
      const ssrClient = getServerClient();
      const { data: { user } } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Verify user is store admin/owner
      const { data: profile } = await ssrClient
        .from("profiles")
        .select("role, store_id")
        .eq("id", user.id)
        .single();

      if (!profile || !["owner", "admin", "manager"].includes(profile.role)) {
        throw new Error("Sem permissão para adicionar avaliações manuais.");
      }

      const { error } = await ssrClient.from("reviews").insert({
        store_id: profile.store_id,
        product_id: productId,
        user_id: user.id, // we tie it to the admin who created it
        rating,
        comment: comment || null,
        status: "approved", // manual reviews are pre-approved
        reviewer_name: reviewerName
      });

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[cms.functions] createManualReview:", e);
      return { status: "error" as const, message: e.message || "Erro ao inserir avaliação manual." };
    }
  });

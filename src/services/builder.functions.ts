/**
 * Builder Platform server functions — Hr Shoes Commerce
 *
 * BFF boundary for Experience Documents, Versions, and Nodes management.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import type { ExperienceDocument, ExperienceNode, ExperienceType } from "@/lib/builder-types";

// ---------------------------------------------------------------------------
// Documents CRUD
// ---------------------------------------------------------------------------

export const listExperienceDocuments = createServerFn({ method: "GET" })
  .validator(z.object({ type: z.string().optional() }).optional())
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();
      let query = db.from("experience_documents").select("*").order("created_at", { ascending: false });
      
      if (input?.type) {
        query = query.eq("document_type", input.type);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return { status: "ok" as const, data: data as ExperienceDocument[] };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
      console.error("[builder.functions] listExperienceDocuments error:", e);
      return { status: "error" as const, message: "Erro ao listar documentos." };
    }
  });

export const getExperienceDocument = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      // 1. Get Document
      const { data: doc, error: docError } = await db
        .from("experience_documents")
        .select("*")
        .eq("id", input.id)
        .single();

      if (docError) throw docError;

      // 2. Get the latest Draft version (or published if no draft)
      const { data: versions, error: versionsError } = await db
        .from("experience_versions")
        .select("*")
        .eq("document_id", input.id)
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (versionsError) throw versionsError;
      
      const version = versions && versions.length > 0 ? versions[0] : null;
      let nodes: ExperienceNode[] = [];
      
      // 3. Get Nodes if version exists
      if (version) {
        const { data: nodesData, error: nodesError } = await db
          .from("experience_nodes")
          .select("*")
          .eq("version_id", version.id)
          .order("sort_order", { ascending: true });
          
        if (nodesError) throw nodesError;
        
        // 4. Hydrate Data Bindings for Editor Preview (Microphase 10)
        const rawNodes = nodesData as ExperienceNode[];
        nodes = await Promise.all(rawNodes.map(async (node) => {
           const bindings = node.data_bindings || {};
           if (bindings.type === "product_collection" && bindings.collection_slug) {
              const { getProductsByCollection } = await import("@/services/catalog.functions");
              const res = await getProductsByCollection({ data: { slug: bindings.collection_slug } }).catch(() => null);
              if (res && res.status === "ok") {
                return { ...node, transient_data: { products: res.data } };
              }
           }
           return node;
        }));
      }

      return { status: "ok" as const, data: { document: doc as ExperienceDocument, version, nodes } };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
      console.error("[builder.functions] getExperienceDocument error:", e);
      return { status: "error" as const, message: "Erro ao carregar documento." };
    }
  });

export const createExperienceDocument = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(1).max(200),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      document_type: z.enum(["storefront", "biolink", "pwa", "campaign", "seller_showcase"]),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      const { data: storeData } = await db.from("stores").select("id").limit(1).single();
      if (!storeData) throw new Error("No store found");

      // 1. Create Document
      const { data: doc, error: docError } = await db
        .from("experience_documents")
        .insert({
          store_id: storeData.id,
          title: input.title,
          slug: input.slug,
          document_type: input.document_type,
          is_active: true,
        })
        .select()
        .single();

      if (docError) throw docError;
      
      // 2. Create Initial Version
      const { data: version, error: versionError } = await db
        .from("experience_versions")
        .insert({
          document_id: doc.id,
          version_number: 1,
          status: 'draft',
        })
        .select()
        .single();
        
      if (versionError) throw versionError;

      return { status: "success" as const, data: { document: doc, version } };
    } catch (e: unknown) {
      console.error("[builder.functions] createExperienceDocument error:", e);
      return { status: "error" as const, message: "Erro ao criar documento." };
    }
  });

// ---------------------------------------------------------------------------
// Public Storefront Rendering & Data Hydration
// ---------------------------------------------------------------------------

export const getPublicExperienceDocumentBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string(), document_type: z.enum(["storefront", "biolink", "pwa", "campaign", "seller_showcase", "product_template", "campaign_popup"]).default("storefront") }))
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      // 1. Get Document
      const { data: doc, error: docError } = await db
        .from("experience_documents")
        .select("*")
        .eq("slug", input.slug)
        .eq("document_type", input.document_type)
        .eq("is_active", true)
        .single();

      if (docError) throw docError;
      
      // Affiliate Tracking Injection
      if (doc.owner_id) {
        const { setSellerRefCookie } = await import("@/lib/session");
        setSellerRefCookie(doc.owner_id);
      }

      // 2. Get the latest PUBLISHED version
      const { data: versions, error: versionsError } = await db
        .from("experience_versions")
        .select("*")
        .eq("document_id", doc.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (versionsError) throw versionsError;
      
      const version = versions && versions.length > 0 ? versions[0] : null;
      if (!version) {
        return { status: "not_found" as const };
      }
      
      // 3. Get Nodes
      const { data: nodesData, error: nodesError } = await db
        .from("experience_nodes")
        .select("*")
        .eq("version_id", version.id)
        .order("sort_order", { ascending: true });
        
      if (nodesError) throw nodesError;
      let nodes = nodesData as ExperienceNode[];
      
      // 4. Hydrate Data Bindings (Microphase 10)
      // Iterate through nodes and resolve bindings (e.g. products, collections)
      const hydratedNodes = await Promise.all(nodes.map(async (node) => {
         const bindings = node.data_bindings || {};
         if (bindings.type === "product_collection" && bindings.collection_slug) {
            // Server-side fetching of catalog data directly into the node state
            const { getProductsByCollection } = await import("@/services/catalog.functions");
            const res = await getProductsByCollection({ data: { slug: bindings.collection_slug } }).catch(() => null);
            if (res && res.status === "ok") {
              // Inject the resolved data into the node's transient state
              return { ...node, transient_data: { products: res.data } };
            }
         }
         return node;
      }));

      // 5. Build Tree
      const buildTree = (flatNodes: any[], parentId: string | null = null): any[] => {
        return flatNodes
          .filter(n => (parentId === null ? !n.parent_id : n.parent_id === parentId))
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(node => ({
            ...node,
            children: buildTree(flatNodes, node.id)
          }));
      };

      const tree = buildTree(hydratedNodes);

      return { status: "ok" as const, data: { document: doc as ExperienceDocument, tree } };
    } catch (e) {
      if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
      console.error("[builder.functions] getPublicExperienceDocumentBySlug error:", e);
      return { status: "error" as const, message: "Erro ao carregar página." };
    }
  });

// ---------------------------------------------------------------------------
// Nodes Editor Mutations
// ---------------------------------------------------------------------------

export const getActiveGlobalPopups = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const db = getServerClient();

      const { data: docs, error: docError } = await db
        .from("experience_documents")
        .select("*")
        .eq("document_type", "campaign_popup")
        .eq("is_active", true);

      if (docError) throw docError;
      if (!docs || docs.length === 0) return { status: "ok" as const, data: [] };

      // Load published versions for all active popup documents
      const activePopups = await Promise.all(docs.map(async (doc) => {
        const { data: versions } = await db
          .from("experience_versions")
          .select("id")
          .eq("document_id", doc.id)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(1);

        const version = versions && versions.length > 0 ? versions[0] : null;
        if (!version) return null;

        const { data: nodesData } = await db
          .from("experience_nodes")
          .select("*")
          .eq("version_id", version.id)
          .order("sort_order", { ascending: true });

        const nodes = (nodesData || []) as ExperienceNode[];
        
        const buildTree = (flatNodes: any[], parentId: string | null = null): any[] => {
          return flatNodes
            .filter(n => (parentId === null ? !n.parent_id : n.parent_id === parentId))
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(node => ({
              ...node,
              children: buildTree(flatNodes, node.id)
            }));
        };

        return {
          id: doc.id,
          trigger_rules: doc.trigger_rules || {},
          tree: buildTree(nodes)
        };
      }));

      return { status: "ok" as const, data: activePopups.filter(Boolean) };
    } catch (e) {
      return { status: "error" as const, message: "Erro ao carregar popups globais." };
    }
  });

export const saveBuilderNodes = createServerFn({ method: "POST" })
  .validator(
    z.object({
      version_id: z.string().uuid(),
      nodes: z.array(z.any()), // Em produção, validaremos com schema mais estrito, por ora aceitamos a árvore
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();
      
      // We perform a full replace of nodes for the version
      // 1. Delete all current nodes for this version
      const { error: delError } = await db
        .from("experience_nodes")
        .delete()
        .eq("version_id", input.version_id);
        
      if (delError) throw delError;
      
      // 2. Insert new nodes if array is not empty
      if (input.nodes.length > 0) {
        const nodesToInsert = input.nodes.map((node: any) => ({
           id: node.id,
           version_id: input.version_id,
           parent_id: node.parent_id || null,
           node_type: node.node_type,
           block_type: node.block_type,
           content: node.content || {},
           design_tokens: node.design_tokens || {},
           layout_rules: node.layout_rules || {},
           responsive_overrides: node.responsive_overrides || {},
           data_bindings: node.data_bindings || {},
           action_bindings: node.action_bindings || {},
           sort_order: node.sort_order || 0,
           is_hidden: node.is_hidden || false,
        }));
        
        const { error: insError } = await db
          .from("experience_nodes")
          .insert(nodesToInsert);
          
        if (insError) throw insError;
      }

      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[builder.functions] saveBuilderNodes error:", e);
      return { status: "error" as const, message: "Erro ao salvar o documento." };
    }
  });

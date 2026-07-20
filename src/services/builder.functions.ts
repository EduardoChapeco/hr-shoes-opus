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
      template_id: z.string().optional(),
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

      // 3. Inject Seed Template if provided
      if (input.template_id && input.template_id !== "blank") {
        const { randomUUID } = await import("crypto");
        let seedNodes: Partial<ExperienceNode>[] = [];
        
        if (input.template_id === "biolink_classic") {
          const sectionId = randomUUID();
          const containerId = randomUUID();
          
          seedNodes = [
            {
              id: sectionId,
              node_type: "section",
              block_type: "section",
              parent_id: null,
              sort_order: 0,
              design_tokens: { backgroundColor: "#f8fafc" },
            },
            {
              id: containerId,
              node_type: "container",
              block_type: "container",
              parent_id: sectionId,
              sort_order: 0,
              layout_rules: { maxWidth: "sm", display: "flex", flexDirection: "col", gap: "md", paddingX: "md", paddingY: "xl" },
            },
            {
              id: randomUUID(),
              node_type: "element",
              block_type: "rich_text",
              parent_id: containerId,
              sort_order: 0,
              content: { html: "<div style='text-align:center'><img src='https://github.com/shadcn.png' style='width:96px;height:96px;border-radius:50%;margin:0 auto;'/><h3>Meu Nome</h3><p>Minha biografia incrível</p></div>" },
            },
            {
              id: randomUUID(),
              node_type: "composition",
              block_type: "social_grid",
              parent_id: containerId,
              sort_order: 1,
              content: { items: [
                { title: "Comprar Agora", link: "/", icon: "ShoppingBag" },
                { title: "WhatsApp", link: "https://wa.me/5511999999999", icon: "Smartphone" }
              ]}
            }
          ];
        } else if (input.template_id === "landing_page") {
          const sectionId = randomUUID();
          const containerId = randomUUID();
          
          seedNodes = [
            {
              id: sectionId,
              node_type: "section",
              block_type: "section",
              parent_id: null,
              sort_order: 0,
            },
            {
              id: containerId,
              node_type: "container",
              block_type: "container",
              parent_id: sectionId,
              sort_order: 0,
              layout_rules: { maxWidth: "xl", display: "flex", flexDirection: "col", gap: "lg", paddingX: "md", paddingY: "lg" },
            },
            {
              id: randomUUID(),
              node_type: "composition",
              block_type: "hero_carousel",
              parent_id: containerId,
              sort_order: 0,
              content: { autoPlay: true, interval: 5, banners: [{ image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" }] }
            },
            {
              id: randomUUID(),
              node_type: "element",
              block_type: "countdown_timer",
              parent_id: containerId,
              sort_order: 1,
              content: { target_date: new Date(Date.now() + 86400000).toISOString(), title: "Oferta Encerra em" }
            },
            {
              id: randomUUID(),
              node_type: "composition",
              block_type: "product_rail",
              parent_id: containerId,
              sort_order: 2,
              content: { title: "Destaques da Coleção", layout: "carousel" },
              data_bindings: { type: "latest_products" }
            }
          ];
        } else if (input.template_id === "institutional_profile") {
          const sectionId = randomUUID();
          const containerId = randomUUID();
          
          seedNodes = [
            {
              id: sectionId,
              node_type: "section",
              block_type: "section",
              parent_id: null,
              sort_order: 0,
              design_tokens: { backgroundColor: "#ffffff" },
            },
            {
              id: containerId,
              node_type: "container",
              block_type: "container",
              parent_id: sectionId,
              sort_order: 0,
              layout_rules: { maxWidth: "xl", display: "flex", flexDirection: "col", gap: "xl", paddingX: "md", paddingY: "2xl" },
            },
            {
              id: randomUUID(),
              node_type: "element",
              block_type: "rich_text",
              parent_id: containerId,
              sort_order: 0,
              content: { html: "<div style='text-align:center'><h1 style='font-size:3rem;font-weight:bold;margin-bottom:1rem;'>Nossa Essência</h1><p style='color:#64748b;font-size:1.25rem;max-width:40rem;margin:0 auto;'>Conectando você ao melhor do design e conforto desde o primeiro passo.</p></div>" },
            },
            {
              id: randomUUID(),
              node_type: "composition",
              block_type: "timeline_history",
              parent_id: containerId,
              sort_order: 1,
              content: { 
                title: "Como tudo começou", 
                events: [
                  { year: "2015", title: "Fundação", description: "Início da nossa jornada vendendo sapatos artesanais." },
                  { year: "2020", title: "Expansão Nacional", description: "Chegamos a todos os estados do Brasil." }
                ] 
              }
            },
            {
              id: randomUUID(),
              node_type: "composition",
              block_type: "testimonial_carousel",
              parent_id: containerId,
              sort_order: 2,
              content: { 
                title: "O que dizem de nós",
                testimonials: [
                  { author: "Maria S.", content: "Melhor loja da vida!", rating: 5 },
                  { author: "João P.", content: "Atendimento impecável.", rating: 5 }
                ]
              }
            }
          ];
        }

        if (seedNodes.length > 0) {
          const nodesToInsert = seedNodes.map(n => ({
            ...n,
            version_id: version.id,
          }));
          await db.from("experience_nodes").insert(nodesToInsert);
        }
      }

      return { status: "success" as const, data: { document: doc, version } };
    } catch (e: unknown) {
      console.error("[builder.functions] createExperienceDocument error:", e);
      return { status: "error" as const, message: "Erro ao criar documento." };
    }
  });

export const getOrCreateHomeDocument = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const db = getServerClient();

      // 1. Check if home document exists
      const { data: doc, error: docError } = await db
        .from("experience_documents")
        .select("*")
        .eq("slug", "home")
        .eq("document_type", "storefront")
        .eq("is_active", true)
        .maybeSingle();

      if (doc) {
        return { status: "success" as const, data: { id: doc.id } };
      }

      // 2. If not, create it
      const { data: storeData } = await db.from("stores").select("id").limit(1).single();
      if (!storeData) throw new Error("No store found");

      const { data: newDoc, error: newDocError } = await db
        .from("experience_documents")
        .insert({
          store_id: storeData.id,
          title: "Vitrine Principal",
          slug: "home",
          document_type: "storefront",
          is_active: true,
        })
        .select()
        .single();

      if (newDocError) throw newDocError;

      // 3. Create initial draft version
      await db
        .from("experience_versions")
        .insert({
          document_id: newDoc.id,
          version_number: 1,
          status: 'draft',
        });

      return { status: "success" as const, data: { id: newDoc.id } };
    } catch (e) {
      console.error("[builder.functions] getOrCreateHomeDocument error:", e);
      return { status: "error" as const, message: "Erro ao criar vitrine principal." };
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
         const bindingType = bindings.type || bindings.source; // accommodate old blocks
         
         if (bindingType === "product_collection" && bindings.collection_slug) {
            // Server-side fetching of catalog data directly into the node state
            const { getProductsByCollection } = await import("@/services/catalog.functions");
            const res = await getProductsByCollection({ data: { slug: bindings.collection_slug } }).catch(() => null);
            if (res && res.status === "ok") {
              // Inject the resolved data into the node's transient state
              return { ...node, transient_data: { products: res.data } };
            }
         } else if (bindingType === "latest_products") {
            const dbRef = getServerClient();
            // Just get the 12 most recently added active products
            const { data: latest } = await dbRef
              .from("products")
              .select("*, variants:product_variants(id,price,promotional_price,stock_quantity,sku)")
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .limit(12);
              
            if (latest) {
               return { ...node, transient_data: { products: latest } };
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
      
      // 1. Set Version to published
      const { error: updError } = await db
        .from("experience_versions")
        .update({ status: "published" })
        .eq("id", input.version_id);
        
      if (updError) throw updError;

      // 2. Delete all current nodes for this version
      const { error: delError } = await db
        .from("experience_nodes")
        .delete()
        .eq("version_id", input.version_id);
        
      if (delError) throw delError;
      
      // 3. Insert new nodes if array is not empty
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

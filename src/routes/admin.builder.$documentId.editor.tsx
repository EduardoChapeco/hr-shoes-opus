import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  GripVertical,
  Settings2,
  Eye,
  Laptop,
  Smartphone,
  Save,
  Layers,
  Trash2,
  ChevronUp,
  ChevronDown,
  LayoutTemplate,
  Zap,
  ImageIcon,
  ShoppingBag,
  AlignLeft,
  Star,
  Timer,
  Shield,
  Video,
  Grid,
  MessageSquare,
  Map,
  ListOrdered,
  Columns2,
  Megaphone,
  X,
  ArrowLeft,
  ExternalLink,
  Check,
  Store,
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getExperienceDocument, saveBuilderNodes, publishBuilderVersion } from "@/services/builder.functions";
import type { ExperienceNode } from "@/lib/builder-types";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";
import { builderRegistry } from "@/lib/builder-registry";
import { MediaUploader } from "@/components/admin/builder/MediaUploader";
import { ColorPicker } from "@/components/admin/builder/ColorPicker";
import { ArrayBuilder } from "@/components/admin/builder/ArrayBuilder";
import { cn } from "@/lib/utils";

// ─── Block Category Definitions ────────────────────────────────────────────────

const BLOCK_CATEGORIES = [
  {
    id: "hero",
    label: "Hero & Banners",
    icon: ImageIcon,
    blocks: ["hero_carousel", "split_banner", "announcement_bar", "mosaic_banners"],
  },
  {
    id: "products",
    label: "Produtos",
    icon: ShoppingBag,
    blocks: ["product_carousel", "product_grid", "product_rail"],
  },
  {
    id: "content",
    label: "Conteúdo",
    icon: AlignLeft,
    blocks: ["rich_text", "info_cards", "bento_grid", "gallery_grid", "video_section", "timeline_history"],
  },
  {
    id: "social",
    label: "Social & Comunidade",
    icon: Star,
    blocks: ["testimonial_carousel", "stories_ring", "social_grid"],
  },
  {
    id: "conversion",
    label: "Conversão",
    icon: Zap,
    blocks: ["countdown_timer", "trust_badges", "faq_accordion", "contact_form"],
  },
  {
    id: "store_profile",
    label: "Perfil da Loja",
    icon: Store,
    blocks: ["store_profile_hero", "store_hours", "store_contact"],
  },
];

// Pre-built sections that insert a full (section + container + block) group
const SECTION_PRESETS = [
  {
    id: "hero",
    label: "Hero Principal",
    description: "Banner de destaque com imagem e CTA",
    icon: ImageIcon,
    color: "bg-violet-50 border-violet-200",
    iconColor: "text-violet-500",
    blocks: ["section", "container", "hero_carousel"],
  },
  {
    id: "product_carousel",
    label: "Carrossel de Produtos",
    description: "Produtos reais em carrossel deslizante",
    icon: ShoppingBag,
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-500",
    blocks: ["section", "container", "product_carousel"],
  },
  {
    id: "product_grid",
    label: "Grid de Produtos",
    description: "Grade de produtos 2, 3 ou 4 colunas",
    icon: Grid,
    color: "bg-cyan-50 border-cyan-200",
    iconColor: "text-cyan-500",
    blocks: ["section", "container", "product_grid"],
  },
  {
    id: "split_banner",
    label: "Banner Dividido 50/50",
    description: "Imagem de um lado, texto do outro",
    icon: Columns2,
    color: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-500",
    blocks: ["section", "container_full", "split_banner"],
  },
  {
    id: "announcement_bar",
    label: "Barra de Anúncio",
    description: "Faixa de aviso/promoção no topo",
    icon: Megaphone,
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-500",
    blocks: ["section", "container", "announcement_bar"],
  },
  {
    id: "testimonials",
    label: "Depoimentos",
    description: "Carrossel de avaliações de clientes",
    icon: MessageSquare,
    color: "bg-pink-50 border-pink-200",
    iconColor: "text-pink-500",
    blocks: ["section", "container", "testimonial_carousel"],
  },
  {
    id: "countdown",
    label: "Cronômetro Regressivo",
    description: "Timer para ofertas com prazo",
    icon: Timer,
    color: "bg-red-50 border-red-200",
    iconColor: "text-red-500",
    blocks: ["section", "container", "countdown_timer"],
  },
  {
    id: "trust_badges",
    label: "Selos de Confiança",
    description: "Badges de garantia, frete, segurança",
    icon: Shield,
    color: "bg-teal-50 border-teal-200",
    iconColor: "text-teal-500",
    blocks: ["section", "container", "trust_badges"],
  },
  {
    id: "bento",
    label: "Bento Grid",
    description: "Mosaico assimétrico de cards",
    icon: LayoutTemplate,
    color: "bg-indigo-50 border-indigo-200",
    iconColor: "text-indigo-500",
    blocks: ["section", "container", "bento_grid"],
  },
  {
    id: "gallery",
    label: "Galeria de Imagens",
    description: "Grade editorial de fotos",
    icon: ImageIcon,
    color: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-500",
    blocks: ["section", "container", "gallery_grid"],
  },
  {
    id: "faq",
    label: "FAQ",
    description: "Perguntas e respostas em accordion",
    icon: ListOrdered,
    color: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-500",
    blocks: ["section", "container", "faq_accordion"],
  },
  {
    id: "timeline",
    label: "Timeline / História",
    description: "Linha do tempo da marca",
    icon: Map,
    color: "bg-yellow-50 border-yellow-200",
    iconColor: "text-yellow-500",
    blocks: ["section", "container", "timeline_history"],
  },
  {
    id: "video",
    label: "Vídeo Embed",
    description: "YouTube ou Vimeo incorporado",
    icon: Video,
    color: "bg-rose-50 border-rose-200",
    iconColor: "text-rose-500",
    blocks: ["section", "container", "video_section"],
  },
  {
    id: "rich_text",
    label: "Texto Rico",
    description: "Bloco de conteúdo editorial HTML",
    icon: AlignLeft,
    color: "bg-gray-50 border-gray-200",
    iconColor: "text-gray-500",
    blocks: ["section", "container", "rich_text"],
  },
];

// ─── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/builder/$documentId/editor")({
  head: () => ({ meta: [{ title: "Editor Visual — Builder" }] }),
  loader: async ({ params }) => {
    const res = await getExperienceDocument({ data: { id: params.documentId } });
    if (res.status === "error" || res.status === "unconfigured") {
      throw new Error("Erro ao carregar Builder");
    }
    return {
      document: res.data.document,
      version: res.data.version,
      initialNodes: res.data.nodes,
    };
  },
  component: BuilderEditorIDE,
});

// ─── Utilities ─────────────────────────────────────────────────────────────────

function makeNode(
  blockType: string,
  versionId: string,
  parentId: string | null,
  sortOrder: number,
  extra: Partial<ExperienceNode> = {}
): ExperienceNode {
  const reg = builderRegistry[blockType];
  return {
    id: crypto.randomUUID(),
    version_id: versionId,
    parent_id: parentId,
    sort_order: sortOrder,
    node_type: reg?.defaultProps?.node_type ?? "element",
    block_type: blockType,
    content: reg?.defaultProps?.content ?? {},
    design_tokens: reg?.defaultProps?.design_tokens ?? {},
    layout_rules: reg?.defaultProps?.layout_rules ?? {},
    responsive_overrides: {},
    data_bindings: {},
    action_bindings: {},
    is_hidden: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...extra,
  } as ExperienceNode;
}

function buildTree(flatNodes: ExperienceNode[], parentId: string | null = null): ExperienceNode[] {
  return flatNodes
    .filter(n => (parentId === null ? !n.parent_id : n.parent_id === parentId))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(node => ({ ...node, children: buildTree(flatNodes, node.id) }));
}

// ─── Main Component ────────────────────────────────────────────────────────────

function BuilderEditorIDE() {
  const { document, version, initialNodes } = Route.useLoaderData();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<ExperienceNode[]>(initialNodes);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activePanel, setActivePanel] = useState<"sections" | "blocks" | "layers">("sections");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"content" | "connection" | "design" | "layout">("content");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [blockCategory, setBlockCategory] = useState<string>("hero");

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;
  const blockManifest = selectedNode ? (builderRegistry[selectedNode.block_type] ?? null) : null;
  const treeNodes = buildTree(nodes);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const updateNode = useCallback((id: string, propPath: "content" | "design_tokens" | "layout_rules" | "data_bindings", key: string, value: unknown) => {
    setNodes(prev => prev.map(n =>
      n.id === id ? { ...n, [propPath]: { ...n[propPath], [key]: value } } : n
    ));
  }, []);

  const deleteNode = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idsToDelete = new Set([id]);
    let prev = 0;
    while (idsToDelete.size > prev) {
      prev = idsToDelete.size;
      nodes.forEach(n => { if (n.parent_id && idsToDelete.has(n.parent_id)) idsToDelete.add(n.id); });
    }
    setNodes(p => p.filter(n => !idsToDelete.has(n.id)));
    if (selectedNodeId && idsToDelete.has(selectedNodeId)) setSelectedNodeId(null);
  }, [nodes, selectedNodeId]);

  const moveNode = useCallback((id: string, dir: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    const siblings = nodes.filter(n => n.parent_id === node.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex(n => n.id === id);
    const target = siblings[idx + dir];
    if (!target) return;

    // Swap items in the sibling array
    const newSiblings = [...siblings];
    newSiblings[idx] = target;
    newSiblings[idx + dir] = node;

    // Apply continuous indexes so we never collide
    setNodes(prev => prev.map(n => {
      if (n.parent_id === node.parent_id) {
        const siblingIndex = newSiblings.findIndex(sib => sib.id === n.id);
        return { ...n, sort_order: siblingIndex };
      }
      return n;
    }));
  }, [nodes]);

  const reorderNodeAbsolute = useCallback((sourceId: string, targetId: string) => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode) return;
    
    // Simplificando o drag and drop apenas entre elementos do mesmo nível (mesmo parent)
    if (sourceNode.parent_id !== targetNode.parent_id) return;

    const siblings = nodes.filter(n => n.parent_id === sourceNode.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    const sourceIdx = siblings.findIndex(n => n.id === sourceId);
    const targetIdx = siblings.findIndex(n => n.id === targetId);
    
    if (sourceIdx === -1 || targetIdx === -1) return;

    // Remove do index original e insere no target index
    const newSiblings = [...siblings];
    const [removed] = newSiblings.splice(sourceIdx, 1);
    newSiblings.splice(targetIdx, 0, removed);

    setNodes(prev => prev.map(n => {
      if (n.parent_id === sourceNode.parent_id) {
        const siblingIndex = newSiblings.findIndex(sib => sib.id === n.id);
        return { ...n, sort_order: siblingIndex };
      }
      return n;
    }));
  }, [nodes]);

  // Insert a preset section (section + container + block)
  const insertPreset = useCallback((presetId: string) => {
    if (!version) return;
    const preset = SECTION_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const rootSortOrder = nodes.filter(n => !n.parent_id).length;
    const sectionId = crypto.randomUUID();
    const containerId = crypto.randomUUID();
    const blockId = crypto.randomUUID();

    const isFullWidth = preset.blocks[1] === "container_full";
    const containerBlock = isFullWidth ? "container" : "container";

    const newNodes: ExperienceNode[] = [
      makeNode("section", version.id, null, rootSortOrder, {
        node_type: "section",
        block_type: "section",
        id: sectionId,
      }),
      makeNode(containerBlock, version.id, sectionId, 0, {
        node_type: "container",
        block_type: "container",
        id: containerId,
        layout_rules: isFullWidth
          ? { maxWidth: "full", paddingX: "none", paddingY: "none", display: "flex", flexDirection: "col" }
          : { maxWidth: "2xl", paddingX: "md", paddingY: "lg", display: "flex", flexDirection: "col" },
      }),
      makeNode(preset.blocks[2], version.id, containerId, 0, {
        id: blockId,
        data_bindings: ["product_carousel", "product_grid", "product_rail"].includes(preset.blocks[2])
          ? { type: "dynamic_products", limit: 12 }
          : ["testimonial_carousel"].includes(preset.blocks[2])
          ? { type: "dynamic_reviews" }
          : {},
      }),
    ];

    setNodes(prev => [...prev, ...newNodes]);
    setSelectedNodeId(blockId);
    setActivePanel("layers");
    toast.success(`Seção "${preset.label}" adicionada`);
  }, [nodes, version]);

  // Insert a bare block into the selected container
  const insertBlock = useCallback((blockType: string) => {
    if (!version) return;
    const parent = selectedNode && (selectedNode.block_type === "container" || selectedNode.block_type === "section")
      ? selectedNode
      : null;
    const parentId = parent?.id ?? null;
    const sortOrder = nodes.filter(n => n.parent_id === parentId).length;
    const newNode = makeNode(blockType, version.id, parentId, sortOrder);
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  }, [nodes, version, selectedNode]);

  // ─── Save & Publish ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!version) return;
    setIsSaving(true);
    try {
      const res = await saveBuilderNodes({ data: { version_id: version.id, nodes } });
      if (res.status === "success") toast.success("Salvo com sucesso!");
      else toast.error("Erro ao salvar.");
    } catch { toast.error("Erro inesperado ao salvar."); }
    finally { setIsSaving(false); }
  };

  const handlePublish = async () => {
    if (!version) return;
    setIsPublishing(true);
    try {
      // First save, then publish
      await saveBuilderNodes({ data: { version_id: version.id, nodes } });
      const res = await publishBuilderVersion({ data: { version_id: version.id, nodes } });
      if (res.status === "success") toast.success("Publicado! Página pública atualizada.");
      else toast.error("Erro ao publicar.");
    } catch { toast.error("Erro inesperado ao publicar."); }
    finally { setIsPublishing(false); }
  };

  // ─── Preview URL ────────────────────────────────────────────────────────

  const previewUrl = (() => {
    const doc = document;
    if (!doc) return null;
    if (doc.slug === "home" || doc.document_type === "storefront") return "/";
    if (doc.slug === "institucional") return "/perfil-da-loja";
    if (doc.document_type === "biolink") return `/bio/${doc.slug}`;
    if (doc.document_type === "seller_showcase") return `/vendedora/${doc.slug}`;
    return `/paginas/${doc.slug}`;
  })();

  // ─── Layer Tree ─────────────────────────────────────────────────────────

  const renderLayer = (node: ExperienceNode & { children?: ExperienceNode[] }, depth = 0): React.ReactNode => {
    const isSelected = selectedNodeId === node.id;
    const isDragged = draggedNodeId === node.id;
    const isDragOver = dragOverNodeId === node.id;
    const reg = builderRegistry[node.block_type];
    
    return (
      <div key={node.id}>
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            setDraggedNodeId(node.id);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", node.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedNodeId && draggedNodeId !== node.id) {
              setDragOverNodeId(node.id);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragOverNodeId === node.id) setDragOverNodeId(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverNodeId(null);
            if (draggedNodeId && draggedNodeId !== node.id) {
              reorderNodeAbsolute(draggedNodeId, node.id);
            }
            setDraggedNodeId(null);
          }}
          onDragEnd={() => {
            setDraggedNodeId(null);
            setDragOverNodeId(null);
          }}
          className={cn(
            "flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-sm cursor-grab active:cursor-grabbing transition-colors group select-none relative",
            isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground",
            isDragged && "opacity-50",
            isDragOver && "border-t-2 border-t-primary" // Feedback visual simples de drop
          )}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => setSelectedNodeId(node.id)}
        >
          <GripVertical className="h-3 w-3 opacity-30 shrink-0" />
          <span className="truncate flex-1 text-xs">{reg?.name ?? node.block_type}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-0.5 rounded hover:bg-muted-foreground/20" onClick={e => moveNode(node.id, -1, e)}><ChevronUp className="h-3 w-3" /></button>
            <button className="p-0.5 rounded hover:bg-muted-foreground/20" onClick={e => moveNode(node.id, 1, e)}><ChevronDown className="h-3 w-3" /></button>
            <button className="p-0.5 rounded hover:bg-destructive/20 text-destructive" onClick={e => deleteNode(node.id, e)}><Trash2 className="h-3 w-3" /></button>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div>{node.children.map(c => renderLayer(c as any, depth + 1))}</div>
        )}
      </div>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 flex flex-col bg-[#111] overflow-hidden z-50">

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="flex-none h-12 bg-[#1a1a1a] border-b border-white/10 flex items-center justify-between px-3 gap-3">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate({ to: "/admin/builder", search: {} as any })}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:block">Sair</span>
          </button>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-semibold truncate">{document.title}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="text-white/40 text-[10px]">Rascunho v{version?.version_number ?? 1}</span>
            </div>
          </div>
        </div>

        {/* Center: Viewport */}
        <div className="flex items-center bg-white/5 rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewport("desktop")}
            className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", viewport === "desktop" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70")}
          >
            <Laptop className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", viewport === "mobile" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70")}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors hidden md:flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visualizar
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || isSaving}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            <Check className="h-3.5 w-3.5" />
            {isPublishing ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </header>

      {/* ── Workspace ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Panel (Sections / Blocks / Layers) ───────────────────── */}
        <aside className="w-72 bg-[#1a1a1a] border-r border-white/10 flex flex-col flex-none overflow-hidden">
          {/* Panel Tabs */}
          <div className="flex border-b border-white/10 bg-[#161616]">
            {(["sections", "blocks", "layers"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActivePanel(tab)}
                className={cn(
                  "flex-1 py-2.5 text-[11px] font-medium uppercase tracking-wide transition-colors",
                  activePanel === tab
                    ? "text-white border-b-2 border-primary"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                {tab === "sections" ? "Seções" : tab === "blocks" ? "Blocos" : "Camadas"}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            {/* SECTIONS: Pre-built section presets */}
            {activePanel === "sections" && (
              <div className="p-3 space-y-2">
                <p className="text-[11px] text-white/40 uppercase tracking-wider px-1 mb-3">
                  Clique para adicionar seção
                </p>
                {SECTION_PRESETS.map(preset => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => insertPreset(preset.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group border border-transparent hover:border-white/10"
                    >
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/10")}>
                        <Icon className={cn("h-4 w-4", preset.iconColor)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-xs font-medium truncate">{preset.label}</div>
                        <div className="text-white/40 text-[10px] truncate">{preset.description}</div>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-white/30 group-hover:text-white/70 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* BLOCKS: Categorized block picker */}
            {activePanel === "blocks" && (
              <div className="flex flex-col">
                {/* Category tabs */}
                <div className="flex flex-col gap-0.5 p-2 border-b border-white/10">
                  {BLOCK_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setBlockCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left",
                          blockCategory === cat.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
                {/* Block items */}
                <div className="p-3 grid grid-cols-2 gap-2">
                  {(BLOCK_CATEGORIES.find(c => c.id === blockCategory)?.blocks ?? []).map(blockType => {
                    const reg = builderRegistry[blockType];
                    if (!reg) return null;
                    return (
                      <button
                        key={blockType}
                        onClick={() => insertBlock(blockType)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors text-center"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white/50" />
                        </div>
                        <span className="text-white/70 text-[10px] font-medium leading-tight">{reg.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-white/30 text-center pb-3 px-3">
                  Selecione um container na árvore antes de inserir
                </p>
              </div>
            )}

            {/* LAYERS: DOM tree */}
            {activePanel === "layers" && (
              <div className="p-3">
                <p className="text-[11px] text-white/40 uppercase tracking-wider px-1 mb-3">
                  Estrutura da Página
                </p>
                {nodes.length === 0 ? (
                  <div className="text-center py-8 text-white/30 text-xs space-y-2">
                    <Layers className="h-8 w-8 mx-auto opacity-30" />
                    <p>Árvore vazia.</p>
                    <p>Adicione seções no painel "Seções".</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {treeNodes.map(node => renderLayer(node as any, 0))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </aside>

        {/* ── Canvas ──────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#0d0d0d] flex flex-col items-center">
          {/* Viewport indicator */}
          <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-[#0d0d0d] w-full">
            <Badge variant="outline" className="text-white/40 border-white/10 text-[10px] bg-transparent">
              {viewport === "desktop" ? "Desktop — 1440px" : "Mobile — 390px"}
            </Badge>
          </div>

          {/* Canvas frame */}
          <div
            className={cn(
              "bg-white relative transition-all duration-300 mb-8 flex flex-col shadow-2xl",
              viewport === "desktop"
                ? "w-full max-w-[1280px] min-h-[calc(100vh-140px)] rounded-xl overflow-hidden"
                : "w-[390px] h-[780px] rounded-[3rem] border-[12px] border-[#222] overflow-hidden"
            )}
            onClick={() => setSelectedNodeId(null)}
          >
            {/* Scrollable content wrapper */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full h-full flex flex-col bg-white">
              {nodes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-gray-400 gap-4 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                    <Plus className="h-8 w-8 text-gray-300" />
                  </div>
                  <div className="max-w-xs">
                    <p className="font-semibold text-gray-600 text-sm">Canvas vazio</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Adicione seções no painel à esquerda para construir sua página.
                    </p>
                  </div>
                </div>
              ) : (
                <ExperienceRenderer
                  nodes={treeNodes}
                  isEditing
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                />
              )}
            </div>
          </div>
        </main>

        {/* ── Right Inspector ──────────────────────────────────────────── */}
        <aside className="w-72 bg-[#1a1a1a] border-l border-white/10 flex flex-col flex-none overflow-hidden">
          {selectedNode && blockManifest ? (
            <>
              {/* Inspector Header */}
              <div className="flex-none border-b border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-semibold">{blockManifest.name}</p>
                    <p className="text-white/40 text-[10px] font-mono">{selectedNode.block_type}</p>
                  </div>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-white/30 hover:text-white/70 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Inspector Tabs */}
                <div className="flex gap-1 mt-3">
                  {(["content", "connection", ...(blockManifest.inspector?.layout ? ["layout"] : []), ...(blockManifest.inspector?.design ? ["design"] : [])] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setInspectorTab(tab as any)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize",
                        inspectorTab === tab ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"
                      )}
                    >
                      {tab === "content" ? "Conteúdo" : tab === "connection" ? "Dados" : tab === "layout" ? "Layout" : "Design"}
                    </button>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">

                  {/* Content Tab */}
                  {inspectorTab === "content" && (
                    <div className="space-y-4">
                      {blockManifest.inspector?.content?.map(field => (
                        <div key={field.name} className="space-y-1.5">
                          <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">{field.label}</label>
                          {field.type === "textarea" ? (
                            <Textarea
                              className="text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                              rows={3}
                              value={(selectedNode.content as any)?.[field.name] ?? ""}
                              onChange={e => updateNode(selectedNode.id, "content", field.name, e.target.value)}
                            />
                          ) : field.type === "json" || field.type === "array" ? (
                            <ArrayBuilder
                              label={field.label}
                              value={Array.isArray((selectedNode.content as any)?.[field.name]) ? (selectedNode.content as any)[field.name] : []}
                              onChange={val => updateNode(selectedNode.id, "content", field.name, val)}
                              arrayFields={field.arrayFields ?? []}
                            />
                          ) : field.type === "image" ? (
                            <MediaUploader
                              value={(selectedNode.content as any)?.[field.name] ?? ""}
                              onChange={val => updateNode(selectedNode.id, "content", field.name, val)}
                            />
                          ) : field.type === "color" ? (
                            <ColorPicker
                              value={(selectedNode.content as any)?.[field.name] ?? ""}
                              onChange={val => updateNode(selectedNode.id, "content", field.name, val)}
                            />
                          ) : field.type === "boolean" ? (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(selectedNode.content as any)?.[field.name] ?? false}
                                onChange={e => updateNode(selectedNode.id, "content", field.name, e.target.checked)}
                                className="w-4 h-4 accent-primary"
                              />
                              <span className="text-white/60 text-xs">{field.label}</span>
                            </label>
                          ) : field.type === "number" ? (
                            <Input
                              type="number"
                              className="h-8 text-sm bg-white/5 border-white/10 text-white"
                              value={(selectedNode.content as any)?.[field.name] ?? ""}
                              onChange={e => updateNode(selectedNode.id, "content", field.name, Number(e.target.value))}
                            />
                          ) : (
                            <Input
                              className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30"
                              value={(selectedNode.content as any)?.[field.name] ?? ""}
                              onChange={e => updateNode(selectedNode.id, "content", field.name, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                      {(!blockManifest.inspector?.content || blockManifest.inspector.content.length === 0) && (
                        <p className="text-white/30 text-xs">Este bloco não tem campos de conteúdo editáveis.</p>
                      )}
                    </div>
                  )}

                  {/* Connection / Data Binding Tab */}
                  {inspectorTab === "connection" && (
                    <div className="space-y-4">
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-white/60 text-[11px] mb-1 font-medium">Fonte de Dados</p>
                        <p className="text-white/30 text-[10px]">
                          Quando configurado, os dados são resolvidos no servidor antes de chegar ao canvas.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">Resolver</label>
                        <select
                          className="w-full text-sm p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                          value={(selectedNode.data_bindings as any)?.type ?? ""}
                          onChange={e => {
                            const type = e.target.value;
                            setNodes(prev => prev.map(n => n.id === selectedNodeId
                              ? { ...n, data_bindings: type ? { type } : {} }
                              : n
                            ));
                          }}
                        >
                          <option value="">Nenhum (conteúdo estático)</option>
                          <option value="dynamic_products">Últimos Produtos Ativos</option>
                          <option value="product_collection">Produtos por Coleção</option>
                          <option value="dynamic_reviews">Avaliações Aprovadas</option>
                        </select>
                      </div>
                      {(selectedNode.data_bindings as any)?.type === "product_collection" && (
                        <div className="space-y-1.5">
                          <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">Slug da Coleção</label>
                          <Input
                            placeholder="ex: inverno-2026"
                            className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            value={(selectedNode.data_bindings as any)?.collection_slug ?? ""}
                            onChange={e => updateNode(selectedNode.id, "data_bindings", "collection_slug", e.target.value)}
                          />
                        </div>
                      )}
                      {(selectedNode.data_bindings as any)?.type === "dynamic_products" && (
                        <div className="space-y-1.5">
                          <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">Quantidade</label>
                          <Input
                            type="number"
                            min={1}
                            max={24}
                            className="h-8 text-sm bg-white/5 border-white/10 text-white"
                            value={(selectedNode.data_bindings as any)?.limit ?? 12}
                            onChange={e => updateNode(selectedNode.id, "data_bindings", "limit", Number(e.target.value))}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Layout Tab */}
                  {inspectorTab === "layout" && blockManifest.inspector?.layout && (
                    <div className="space-y-4">
                      {blockManifest.inspector.layout.map(field => (
                        <div key={field.name} className="space-y-1.5">
                          <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">{field.label}</label>
                          {field.type === "select" && field.options ? (
                            <select
                              className="w-full text-sm p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                              value={(selectedNode.layout_rules as any)?.[field.name] ?? ""}
                              onChange={e => updateNode(selectedNode.id, "layout_rules", field.name, e.target.value)}
                            >
                              {field.options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              className="h-8 text-sm bg-white/5 border-white/10 text-white"
                              value={(selectedNode.layout_rules as any)?.[field.name] ?? ""}
                              onChange={e => updateNode(selectedNode.id, "layout_rules", field.name, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Design Tab */}
                  {inspectorTab === "design" && blockManifest.inspector?.design && (
                    <div className="space-y-4">
                      {blockManifest.inspector.design.map(field => (
                        <div key={field.name} className="space-y-1.5">
                          <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">{field.label}</label>
                          {field.type === "color" ? (
                            <ColorPicker
                              value={(selectedNode.design_tokens as any)?.[field.name] ?? ""}
                              onChange={val => updateNode(selectedNode.id, "design_tokens", field.name, val)}
                            />
                          ) : field.type === "image" ? (
                            <MediaUploader
                              value={(selectedNode.design_tokens as any)?.[field.name] ?? ""}
                              onChange={val => updateNode(selectedNode.id, "design_tokens", field.name, val)}
                            />
                          ) : (
                            <Input
                              className="h-8 text-sm bg-white/5 border-white/10 text-white"
                              value={(selectedNode.design_tokens as any)?.[field.name] ?? ""}
                              onChange={e => updateNode(selectedNode.id, "design_tokens", field.name, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            /* No selection state */
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
              <Settings2 className="h-8 w-8 text-white/20" />
              <p className="text-white/30 text-sm">Selecione um bloco no canvas para editar suas propriedades.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

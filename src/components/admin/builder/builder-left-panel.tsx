import * as React from "react";
import { useState } from "react";
import {
  Plus,
  ImageIcon,
  ShoppingBag,
  AlignLeft,
  Star,
  Zap,
  Store,
  Grid,
  Columns2,
  Megaphone,
  MessageSquare,
  Timer,
  Shield,
  LayoutTemplate,
  ListOrdered,
  Map,
  Video,
  Layers,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { builderRegistry } from "@/lib/builder-registry";

// ─── Block Category Definitions ────────────────────────────────────────────────

export const BLOCK_CATEGORIES = [
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
    blocks: [
      "rich_text",
      "info_cards",
      "bento_grid",
      "gallery_grid",
      "video_section",
      "timeline_history",
    ],
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
  {
    id: "media",
    label: "Mídia Interativa",
    icon: SlidersHorizontal,
    blocks: ["before_after_slider", "image_hotspots", "routine_steps", "ingredient_spotlight"],
  },
];

// Pre-built sections that insert a full (section + container + block) group
export const SECTION_PRESETS = [
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

export type LeftPanelTab = "sections" | "blocks" | "layers";

export interface BuilderLeftPanelProps {
  activePanel: LeftPanelTab | string;
  setActivePanel: (tab: any) => void;
  blockCategory: string;
  setBlockCategory: (cat: string) => void;
  insertPreset: (id: string) => void;
  insertBlock: (type: string) => void;
  nodes: any[];
  treeNodes: any[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  moveNode: (id: string, direction: any, e: any) => void;
  deleteNode: (id: string, e: any) => void;
  reorderNodeAbsolute: (sourceId: string, targetId: string) => void;
}

export function BuilderLeftPanel({
  activePanel,
  setActivePanel,
  blockCategory,
  setBlockCategory,
  insertPreset,
  insertBlock,
  nodes,
  treeNodes,
  selectedNodeId,
  setSelectedNodeId,
  moveNode,
  deleteNode,
  reorderNodeAbsolute,
}: BuilderLeftPanelProps) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);

  const renderLayer = (
    node: { id: string; block_type: string; children?: any[] },
    depth = 0,
  ): React.ReactNode => {
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
            isSelected
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-white/5 text-white/70 hover:text-white",
            isDragged && "opacity-50",
            isDragOver && "border-t-2 border-t-primary", // Feedback visual simples de drop
          )}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => setSelectedNodeId(node.id)}
        >
          <GripVertical className="h-3 w-3 opacity-30 shrink-0" />
          <span className="truncate flex-1 text-xs">{reg?.name ?? node.block_type}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="p-0.5 rounded hover:bg-white/10 text-white/50 hover:text-white"
              onClick={(e) => moveNode(node.id, -1, e)}
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="p-0.5 rounded hover:bg-white/10 text-white/50 hover:text-white"
              onClick={(e) => moveNode(node.id, 1, e)}
            >
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="p-0.5 rounded hover:bg-destructive/20 text-destructive"
              onClick={(e) => deleteNode(node.id, e)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div>{node.children.map((c) => renderLayer(c, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-72 bg-[#1a1a1a] border-r border-white/10 flex flex-col flex-none overflow-hidden">
      {/* Panel Tabs */}
      <div className="flex border-b border-white/10 bg-[#161616]">
        {(["sections", "blocks", "layers"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActivePanel(tab)}
            className={cn(
              "flex-1 py-2.5 text-[11px] font-medium uppercase tracking-wide transition-colors",
              activePanel === tab
                ? "text-white border-b-2 border-primary"
                : "text-white/40 hover:text-white/70",
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
            {SECTION_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => insertPreset(preset.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group border border-transparent hover:border-white/10"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/10",
                    )}
                  >
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
              {BLOCK_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setBlockCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left",
                      blockCategory === cat.id
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5",
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
              {(BLOCK_CATEGORIES.find((c) => c.id === blockCategory)?.blocks ?? []).map(
                (blockType) => {
                  const reg = builderRegistry[blockType];
                  if (!reg) return null;
                  return (
                    <button
                      type="button"
                      key={blockType}
                      onClick={() => insertBlock(blockType)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors text-center"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white/50" />
                      </div>
                      <span className="text-white/70 text-[10px] font-medium leading-tight">
                        {reg.name}
                      </span>
                    </button>
                  );
                },
              )}
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
              <div className="space-y-0.5">{treeNodes.map((node) => renderLayer(node, 0))}</div>
            )}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

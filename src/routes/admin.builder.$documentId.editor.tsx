import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutTemplate, X } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getExperienceDocument,
  saveBuilderNodes,
  publishBuilderVersion,
  applyHomeTemplate,
} from "@/services/builder.functions";
import { HOME_TEMPLATES_LIBRARY } from "@/lib/home-templates-library";
import { listCollections, listCategories } from "@/services/admin-catalog.functions";
import type { ExperienceNode } from "@/lib/builder-types";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";
import { builderRegistry } from "@/lib/builder-registry";
import { cn } from "@/lib/utils";
import { BuilderTopBar } from "@/components/admin/builder/builder-top-bar";
import {
  BuilderLeftPanel,
  BLOCK_CATEGORIES,
  SECTION_PRESETS,
} from "@/components/admin/builder/builder-left-panel";
import { BuilderCanvas } from "@/components/admin/builder/builder-canvas";
import { BuilderInspector } from "@/components/admin/builder/builder-inspector";

// ─── History Hook ─────────────────────────────────────────────────────────────

function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const pushState = useCallback(
    (newStateOrUpdater: T | ((prev: T) => T)) => {
      setHistory((prevHistory) => {
        const currentState = prevHistory[currentIndex];
        const newState =
          typeof newStateOrUpdater === "function"
            ? (newStateOrUpdater as (prev: T) => T)(currentState)
            : newStateOrUpdater;

        const trimmedHistory = prevHistory.slice(0, currentIndex + 1);
        return [...trimmedHistory, newState];
      });
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex],
  );

  const undo = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  return {
    state: history[currentIndex],
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
}

// ─── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/builder/$documentId/editor")({
  head: () => ({ meta: [{ title: "Editor Visual — Builder" }] }),
  loader: async ({ params }) => {
    const res = await getExperienceDocument({ data: { id: params.documentId } });

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
  extra: Partial<ExperienceNode> = {},
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
    .filter((n) => (parentId === null ? !n.parent_id : n.parent_id === parentId))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((node) => ({ ...node, children: buildTree(flatNodes, node.id) }));
}

// ─── Main Component ────────────────────────────────────────────────────────────

function BuilderEditorIDE() {
  const { document, version, initialNodes } = Route.useLoaderData();
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ["admin_categories"],
    queryFn: () => listCategories(),
  });

  const { data: collections } = useQuery({
    queryKey: ["admin_collections"],
    queryFn: () => listCollections(),
  });

  const {
    state: nodes,
    pushState: setNodes,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<ExperienceNode[]>(initialNodes);

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"sections" | "blocks" | "layers">("sections");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleApplyPresetTemplate = async (templateId: string) => {
    if (!document?.id) return;
    setIsApplyingTemplate(true);
    try {
      const res = await applyHomeTemplate({
        data: { document_id: document.id, template_id: templateId },
      });
      if (res && res.status === "success") {
        toast.success("Template aplicado com sucesso! Carregando rascunho...");
        window.location.reload();
      } else {
        toast.error("Erro ao aplicar template.");
      }
    } catch (e: any) {
      toast.error(e.message || "Falha ao aplicar template.");
    } finally {
      setIsApplyingTemplate(false);
      setIsTemplateModalOpen(false);
    }
  };

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          if (canRedo) redo();
        } else {
          e.preventDefault();
          if (canUndo) undo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);
  const [inspectorTab, setInspectorTab] = useState<"content" | "connection" | "design" | "layout">(
    "content",
  );
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [blockCategory, setBlockCategory] = useState<string>("hero");

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const blockManifest = selectedNode ? (builderRegistry[selectedNode.block_type] ?? null) : null;
  const treeNodes = buildTree(nodes);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const updateNode = useCallback(
    (
      id: string,
      propPath: "content" | "design_tokens" | "layout_rules" | "data_bindings",
      key: string,
      value: unknown,
    ) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, [propPath]: { ...n[propPath], [key]: value } } : n)),
      );
    },
    [],
  );

  const deleteNode = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const idsToDelete = new Set([id]);
      let prev = 0;
      while (idsToDelete.size > prev) {
        prev = idsToDelete.size;
        nodes.forEach((n) => {
          if (n.parent_id && idsToDelete.has(n.parent_id)) idsToDelete.add(n.id);
        });
      }
      setNodes((p) => p.filter((n) => !idsToDelete.has(n.id)));
      if (selectedNodeId && idsToDelete.has(selectedNodeId)) setSelectedNodeId(null);
    },
    [nodes, selectedNodeId],
  );

  const moveNode = useCallback(
    (id: string, dir: -1 | 1, e: React.MouseEvent) => {
      e.stopPropagation();
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      const siblings = nodes
        .filter((n) => n.parent_id === node.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const idx = siblings.findIndex((n) => n.id === id);
      const target = siblings[idx + dir];
      if (!target) return;

      // Swap items in the sibling array
      const newSiblings = [...siblings];
      newSiblings[idx] = target;
      newSiblings[idx + dir] = node;

      // Apply continuous indexes so we never collide
      setNodes((prev) =>
        prev.map((n) => {
          if (n.parent_id === node.parent_id) {
            const siblingIndex = newSiblings.findIndex((sib) => sib.id === n.id);
            return { ...n, sort_order: siblingIndex };
          }
          return n;
        }),
      );
    },
    [nodes],
  );

  const reorderNodeAbsolute = useCallback(
    (sourceId: string, targetId: string) => {
      const sourceNode = nodes.find((n) => n.id === sourceId);
      const targetNode = nodes.find((n) => n.id === targetId);
      if (!sourceNode || !targetNode) return;

      // Simplificando o drag and drop apenas entre elementos do mesmo nível (mesmo parent)
      if (sourceNode.parent_id !== targetNode.parent_id) return;

      const siblings = nodes
        .filter((n) => n.parent_id === sourceNode.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const sourceIdx = siblings.findIndex((n) => n.id === sourceId);
      const targetIdx = siblings.findIndex((n) => n.id === targetId);

      if (sourceIdx === -1 || targetIdx === -1) return;

      // Remove do index original e insere no target index
      const newSiblings = [...siblings];
      const [removed] = newSiblings.splice(sourceIdx, 1);
      newSiblings.splice(targetIdx, 0, removed);

      setNodes((prev) =>
        prev.map((n) => {
          if (n.parent_id === sourceNode.parent_id) {
            const siblingIndex = newSiblings.findIndex((sib) => sib.id === n.id);
            return { ...n, sort_order: siblingIndex };
          }
          return n;
        }),
      );
    },
    [nodes],
  );

  // Insert a preset section (section + container + block)
  const insertPreset = useCallback(
    (presetId: string) => {
      if (!version) return;
      const preset = SECTION_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      const rootSortOrder = nodes.filter((n) => !n.parent_id).length;
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
            ? {
                maxWidth: "full",
                paddingX: "none",
                paddingY: "none",
                display: "flex",
                flexDirection: "col",
              }
            : {
                maxWidth: "2xl",
                paddingX: "md",
                paddingY: "lg",
                display: "flex",
                flexDirection: "col",
              },
        }),
        makeNode(preset.blocks[2], version.id, containerId, 0, {
          id: blockId,
          data_bindings: ["product_carousel", "product_grid", "product_rail"].includes(
            preset.blocks[2],
          )
            ? { type: "dynamic_products", limit: 12 }
            : ["testimonial_carousel"].includes(preset.blocks[2])
              ? { type: "dynamic_reviews" }
              : {},
        }),
      ];

      setNodes((prev) => [...prev, ...newNodes]);
      setSelectedNodeId(blockId);
      setActivePanel("layers");
      toast.success(`Seção "${preset.label}" adicionada`);
    },
    [nodes, version],
  );

  // Insert a bare block into the selected container
  const insertBlock = useCallback(
    (blockType: string) => {
      if (!version) return;
      const parent =
        selectedNode &&
        (selectedNode.block_type === "container" || selectedNode.block_type === "section")
          ? selectedNode
          : null;
      const parentId = parent?.id ?? null;
      const sortOrder = nodes.filter((n) => n.parent_id === parentId).length;
      const newNode = makeNode(blockType, version.id, parentId, sortOrder);
      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
    },
    [nodes, version, selectedNode],
  );

  // ─── Save & Publish ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!version) return;
    setIsSaving(true);
    try {
      const res = await saveBuilderNodes({ data: { version_id: version.id, nodes } });
      if (res) toast.success("Salvo com sucesso!");
      else toast.error("Erro ao salvar.");
    } catch {
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!version) return;
    setIsPublishing(true);
    try {
      // First save, then publish
      await saveBuilderNodes({ data: { version_id: version.id, nodes } });
      const res = await publishBuilderVersion({ data: { version_id: version.id, nodes } });
      if (res) toast.success("Publicado! Página pública atualizada.");
      else toast.error("Erro ao publicar.");
    } catch {
      toast.error("Erro inesperado ao publicar.");
    } finally {
      setIsPublishing(false);
    }
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

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 flex flex-col bg-[#111] overflow-hidden z-50">
      <BuilderTopBar
        document={document}
        version={version}
        viewport={viewport}
        setViewport={setViewport}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        previewUrl={previewUrl}
        setIsTemplateModalOpen={setIsTemplateModalOpen}
        handleSave={handleSave}
        handlePublish={handlePublish}
        isSaving={isSaving}
        isPublishing={isPublishing}
      />
      <div className="flex-1 flex overflow-hidden">
        <BuilderLeftPanel
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          blockCategory={blockCategory}
          setBlockCategory={setBlockCategory}
          insertPreset={insertPreset}
          insertBlock={insertBlock}
          nodes={nodes}
          treeNodes={treeNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          moveNode={moveNode}
          deleteNode={deleteNode}
          reorderNodeAbsolute={reorderNodeAbsolute}
        />
        <BuilderCanvas
          viewport={viewport}
          nodesCount={nodes.length}
          treeNodes={treeNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
        />
        <BuilderInspector
          selectedNodeId={selectedNodeId}
          selectedNode={selectedNode}
          blockManifest={blockManifest}
          inspectorTab={inspectorTab as any}
          setInspectorTab={setInspectorTab as any}
          setSelectedNodeId={setSelectedNodeId}
          updateNode={updateNode}
          setNodes={setNodes as any}
          collections={collections}
          categories={categories}
        />
      </div>

      {/* ── Modal de Seleção de Temas/Templates para Vitrine ──────────────────────── */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-amber-400" />
                  Biblioteca de Temas & Presets de Vitrine
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Escolha um tema inicial para renovar a tela da sua loja. Você poderá editar 100%
                  das seções, textos e imagens depois.
                </p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <ScrollArea className="flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(HOME_TEMPLATES_LIBRARY).map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-[#242427] border border-white/10 rounded-xl overflow-hidden flex flex-col hover:border-amber-500/50 transition-all group shadow-md"
                  >
                    <div className="relative h-44 bg-muted overflow-hidden">
                      <img
                        src={preset.thumbnail}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-500/30">
                        {preset.category}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="font-bold text-white text-base mb-1">{preset.name}</h4>
                      <p className="text-xs text-white/60 line-clamp-3 mb-4 leading-relaxed flex-1">
                        {preset.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {preset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-white/5 text-white/70 px-2 py-0.5 rounded border border-white/5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Button
                        onClick={() => handleApplyPresetTemplate(preset.id)}
                        disabled={isApplyingTemplate}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9"
                      >
                        {isApplyingTemplate ? "Aplicando..." : "Aplicar Este Tema"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Modal Footer */}
            <div className="p-4 bg-[#121214] border-t border-white/10 flex items-center justify-between text-xs text-white/50">
              <span>
                Ao aplicar, o rascunho atual da sua vitrine será substituído pela estrutura do tema
                escolhido.
              </span>
              <Button
                variant="ghost"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

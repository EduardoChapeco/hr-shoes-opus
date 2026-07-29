import * as React from "react";
import { X, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploader } from "@/components/admin/builder/MediaUploader";
import { ColorPicker } from "@/components/admin/builder/ColorPicker";
import { ArrayBuilder } from "@/components/admin/builder/ArrayBuilder";
import type { ExperienceNode } from "@/lib/builder-types";

export type InspectorTab = "content" | "connection" | "layout" | "design";

export interface BuilderInspectorProps {
  selectedNodeId: string | null;
  selectedNode?: ExperienceNode | any;
  blockManifest?: any;
  inspectorTab: InspectorTab;
  setInspectorTab: (tab: InspectorTab) => void;
  setSelectedNodeId: (id: string | null) => void;
  updateNode: (nodeId: string, section: any, field: string, value: any) => void;
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  collections?: any[];
  categories?: any[];
}

export function BuilderInspector({
  selectedNodeId,
  selectedNode,
  blockManifest,
  inspectorTab,
  setInspectorTab,
  setSelectedNodeId,
  updateNode,
  setNodes,
  collections = [],
  categories = [],
}: BuilderInspectorProps) {
  return (
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
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Inspector Tabs */}
            <div className="flex gap-1 mt-3">
              {(
                [
                  "content",
                  "connection",
                  ...(blockManifest.inspector?.layout ? ["layout"] : []),
                  ...(blockManifest.inspector?.design ? ["design"] : []),
                ] as const
              ).map((tab) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setInspectorTab(tab as InspectorTab)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize",
                    inspectorTab === tab
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:text-white/70",
                  )}
                >
                  {tab === "content"
                    ? "Conteúdo"
                    : tab === "connection"
                      ? "Dados"
                      : tab === "layout"
                        ? "Layout"
                        : "Design"}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Content Tab */}
              {inspectorTab === "content" && (
                <div className="space-y-4">
                  {blockManifest.inspector?.content?.map((field: any) => (
                    <div key={field.name} className="space-y-1.5">
                      <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                        {field.label}
                      </label>
                      {field.type === "textarea" ? (
                        <Textarea
                          className="text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                          rows={3}
                          value={(selectedNode.content as any)?.[field.name] ?? ""}
                          onChange={(e) =>
                            updateNode(selectedNode.id, "content", field.name, e.target.value)
                          }
                        />
                      ) : field.type === "json" || field.type === "array" ? (
                        <ArrayBuilder
                          label={field.label}
                          value={
                            Array.isArray((selectedNode.content as any)?.[field.name])
                              ? (selectedNode.content as any)[field.name]
                              : []
                          }
                          onChange={(val) =>
                            updateNode(selectedNode.id, "content", field.name, val)
                          }
                          arrayFields={field.arrayFields ?? []}
                        />
                      ) : field.type === "image" ? (
                        <MediaUploader
                          value={(selectedNode.content as any)?.[field.name] ?? ""}
                          onChange={(val) =>
                            updateNode(selectedNode.id, "content", field.name, val)
                          }
                        />
                      ) : field.type === "color" ? (
                        <ColorPicker
                          value={(selectedNode.content as any)?.[field.name] ?? ""}
                          onChange={(val) =>
                            updateNode(selectedNode.id, "content", field.name, val)
                          }
                        />
                      ) : field.type === "boolean" ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(selectedNode.content as any)?.[field.name] ?? false}
                            onChange={(e) =>
                              updateNode(selectedNode.id, "content", field.name, e.target.checked)
                            }
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-white/60 text-xs">{field.label}</span>
                        </label>
                      ) : field.type === "number" ? (
                        <Input
                          type="number"
                          className="h-8 text-sm bg-white/5 border-white/10 text-white"
                          value={(selectedNode.content as any)?.[field.name] ?? ""}
                          onChange={(e) =>
                            updateNode(
                              selectedNode.id,
                              "content",
                              field.name,
                              Number(e.target.value),
                            )
                          }
                        />
                      ) : (
                        <Input
                          className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          value={(selectedNode.content as any)?.[field.name] ?? ""}
                          onChange={(e) =>
                            updateNode(selectedNode.id, "content", field.name, e.target.value)
                          }
                        />
                      )}
                    </div>
                  ))}
                  {(!blockManifest.inspector?.content ||
                    blockManifest.inspector.content.length === 0) && (
                    <p className="text-white/30 text-xs">
                      Este bloco não tem campos de conteúdo editáveis.
                    </p>
                  )}
                </div>
              )}

              {/* Connection / Data Binding Tab */}
              {inspectorTab === "connection" && (
                <div className="space-y-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/60 text-[11px] mb-1 font-medium">Fonte de Dados</p>
                    <p className="text-white/30 text-[10px]">
                      Quando configurado, os dados são resolvidos no servidor antes de chegar ao
                      canvas.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                      Resolver
                    </label>
                    <select
                      className="w-full text-sm p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      value={(selectedNode.data_bindings as any)?.source ?? ""}
                      onChange={(e) => {
                        const source = e.target.value;
                        setNodes((prev: any[]) =>
                          prev.map((n) =>
                            n.id === selectedNodeId
                              ? { ...n, data_bindings: source ? { source } : {} }
                              : n,
                          ),
                        );
                      }}
                    >
                      <option value="">Nenhum (conteúdo estático)</option>
                      <option value="dynamic_products">Últimos Produtos Ativos</option>
                      <option value="product_collection">Produtos por Coleção</option>
                      <option value="dynamic_reviews">Avaliações Aprovadas</option>
                    </select>
                  </div>
                  {(selectedNode.data_bindings as any)?.source === "product_collection" && (
                    <div className="space-y-1.5">
                      <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                        Coleção ou Categoria
                      </label>
                      <select
                        className="w-full text-sm p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                        value={(selectedNode.data_bindings as any)?.collection_slug ?? ""}
                        onChange={(e) =>
                          updateNode(
                            selectedNode.id,
                            "data_bindings",
                            "collection_slug",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">Selecione para vincular...</option>
                        {collections?.map((col: any) => (
                          <option key={col.id} value={col.slug}>
                            [Coleção] {col.title}
                          </option>
                        ))}
                        {categories?.map((cat: any) => (
                          <option key={cat.id} value={cat.slug}>
                            [Categoria] {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {(selectedNode.data_bindings as any)?.source === "dynamic_products" && (
                    <div className="space-y-1.5">
                      <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                        Quantidade
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={24}
                        className="h-8 text-sm bg-white/5 border-white/10 text-white"
                        value={(selectedNode.data_bindings as any)?.limit ?? 12}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          updateNode(
                            selectedNode.id,
                            "data_bindings",
                            "limit",
                            isNaN(val) ? 0 : val,
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Layout Tab */}
              {inspectorTab === "layout" && blockManifest.inspector?.layout && (
                <div className="space-y-4">
                  {blockManifest.inspector.layout.map((field: any) => (
                    <div key={field.name} className="space-y-1.5">
                      <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                        {field.label}
                      </label>
                      {field.type === "select" && field.options ? (
                        <select
                          className="w-full text-sm p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                          value={(selectedNode.layout_rules as any)?.[field.name] ?? ""}
                          onChange={(e) =>
                            updateNode(selectedNode.id, "layout_rules", field.name, e.target.value)
                          }
                        >
                          {field.options.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          className="h-8 text-sm bg-white/5 border-white/10 text-white"
                          value={(selectedNode.layout_rules as any)?.[field.name] ?? ""}
                          onChange={(e) =>
                            updateNode(selectedNode.id, "layout_rules", field.name, e.target.value)
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Design Tab */}
              {inspectorTab === "design" && blockManifest.inspector?.design && (
                <div className="space-y-4">
                  {blockManifest.inspector.design.map((field: any) => (
                    <div key={field.name} className="space-y-1.5">
                      <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                        {field.label}
                      </label>
                      {field.type === "color" ? (
                        <ColorPicker
                          value={(selectedNode.design_tokens as any)?.[field.name] ?? ""}
                          onChange={(val) =>
                            updateNode(selectedNode.id, "design_tokens", field.name, val)
                          }
                        />
                      ) : field.type === "image" ? (
                        <MediaUploader
                          value={(selectedNode.design_tokens as any)?.[field.name] ?? ""}
                          onChange={(val) =>
                            updateNode(selectedNode.id, "design_tokens", field.name, val)
                          }
                        />
                      ) : (
                        <Input
                          className="h-8 text-sm bg-white/5 border-white/10 text-white"
                          value={(selectedNode.design_tokens as any)?.[field.name] ?? ""}
                          onChange={(e) =>
                            updateNode(selectedNode.id, "design_tokens", field.name, e.target.value)
                          }
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
          <p className="text-white/30 text-sm">
            Selecione um bloco no canvas para editar suas propriedades.
          </p>
        </div>
      )}
    </aside>
  );
}

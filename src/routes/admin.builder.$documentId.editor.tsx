import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, GripVertical, Settings2, Eye, Laptop, Smartphone, Save, PanelLeftClose, PanelRightClose, Layers, Braces, AlignLeft, Trash2, ChevronUp, ChevronDown, LayoutTemplate } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getExperienceDocument, saveBuilderNodes } from "@/services/builder.functions";
import type { ExperienceNode } from "@/lib/builder-types";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";
import { builderRegistry } from "@/lib/builder-registry";
import { MediaUploader } from "@/components/admin/builder/MediaUploader";
import { ColorPicker } from "@/components/admin/builder/ColorPicker";
import { ArrayBuilder } from "@/components/admin/builder/ArrayBuilder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/builder/$documentId/editor")({
  head: () => ({ meta: [{ title: "Editor Avançado — Builder" }] }),
  loader: async ({ params }) => {
    // Carregar o documento específico
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

function BuilderEditorIDE() {
  const { document, version, initialNodes } = Route.useLoaderData();
  const navigate = useNavigate();
  
  const [nodes, setNodes] = useState<ExperienceNode[]>(initialNodes);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"layers" | "blocks" | "sections">("layers");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"content" | "connection" | "design" | "layout">("content");

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const blockManifest = selectedNode ? builderRegistry[selectedNode.block_type] : null;

  const updateSelectedNode = (propPath: "content" | "design_tokens" | "layout_rules" | "data_bindings", key: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(node => {
      if (node.id === selectedNodeId) {
        return {
          ...node,
          [propPath]: {
            ...node[propPath],
            [key]: value
          }
        };
      }
      return node;
    }));
  };

  const handleSave = async () => {
    if (!version) return;
    setIsSaving(true);
    try {
      const res = await saveBuilderNodes({ 
        data: { version_id: version.id, nodes: nodes } 
      });
      if (res.status === "success") {
        toast.success("Documento salvo com sucesso!");
      } else {
        toast.error("Erro ao salvar documento.");
      }
    } catch (e) {
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  // Build the hierarchical tree just for rendering the canvas
  const buildTree = (flatNodes: ExperienceNode[], parentId: string | null = null): ExperienceNode[] => {
    return flatNodes
      .filter(n => (parentId === null ? !n.parent_id : n.parent_id === parentId))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(node => ({
        ...node,
        children: buildTree(flatNodes, node.id)
      }));
  };

  const treeNodes = buildTree(nodes);

  const deleteNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idsToDelete = new Set([id]);
    let currentSize = 0;
    while (idsToDelete.size > currentSize) {
      currentSize = idsToDelete.size;
      nodes.forEach(n => {
        if (n.parent_id && idsToDelete.has(n.parent_id)) {
          idsToDelete.add(n.id);
        }
      });
    }
    setNodes(prev => prev.filter(n => !idsToDelete.has(n.id)));
    if (selectedNodeId && idsToDelete.has(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  };

  const moveNode = (id: string, direction: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    const nodeIndex = nodes.findIndex(n => n.id === id);
    if (nodeIndex === -1) return;
    const node = nodes[nodeIndex];
    
    const siblings = nodes.filter(n => n.parent_id === node.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = siblings.findIndex(n => n.id === id);
    if (currentIndex === -1) return;
    
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= siblings.length) return; 
    
    const siblingToSwap = siblings[targetIndex];
    
    setNodes(prev => prev.map(n => {
      if (n.id === node.id) return { ...n, sort_order: siblingToSwap.sort_order };
      if (n.id === siblingToSwap.id) return { ...n, sort_order: node.sort_order };
      return n;
    }));
  };

  const renderLayer = (node: ExperienceNode, depth = 0) => {
    return (
      <div key={node.id} className="flex flex-col gap-1">
        <div 
          className={`text-sm py-1.5 pr-2 rounded-md flex items-center justify-between cursor-pointer group ${selectedNodeId === node.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
          style={{ paddingLeft: `${(depth * 12) + 8}px` }}
          onClick={() => setSelectedNodeId(node.id)}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <GripVertical className="h-3 w-3 opacity-50 shrink-0" />
            <span className="truncate">{builderRegistry[node.block_type]?.name || node.block_type}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => moveNode(node.id, -1, e)} className="p-1 hover:bg-muted-foreground/20 rounded"><ChevronUp className="h-3 w-3" /></button>
            <button onClick={(e) => moveNode(node.id, 1, e)} className="p-1 hover:bg-muted-foreground/20 rounded"><ChevronDown className="h-3 w-3" /></button>
            <button onClick={(e) => deleteNode(node.id, e)} className="p-1 hover:bg-destructive/20 text-destructive rounded"><Trash2 className="h-3 w-3" /></button>
          </div>
        </div>
        {(node as any).children && (node as any).children.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {(node as any).children.map((child: any) => renderLayer(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Navbar - IDE Controls */}
      <header className="flex-none h-14 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/builder" })}>
            Sair
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{document.title}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              Rascunho (v{version?.version_number || 1})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Viewport Switcher */}
          <div className="flex items-center bg-muted rounded-md p-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground shadow-sm bg-background">
              <Laptop className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-4 w-px bg-border mx-2" />
          <Button variant="outline" size="sm" disabled>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar (Layers & Blocks) */}
        <aside className="w-64 border-r bg-card flex flex-col flex-none">
          <div className="flex items-center border-b p-1">
            <Button 
              variant={activeTab === "layers" ? "secondary" : "ghost"} 
              size="sm" 
              className="flex-1 rounded-sm justify-center px-1"
              onClick={() => setActiveTab("layers")}
            >
              <Layers className="h-4 w-4 mr-1" />
              Camadas
            </Button>
            <Button 
              variant={activeTab === "sections" ? "secondary" : "ghost"} 
              size="sm" 
              className="flex-1 rounded-sm justify-center px-1"
              onClick={() => setActiveTab("sections")}
            >
              <LayoutTemplate className="h-4 w-4 mr-1" />
              Seções
            </Button>
            <Button 
              variant={activeTab === "blocks" ? "secondary" : "ghost"} 
              size="sm" 
              className="flex-1 rounded-sm justify-center px-1"
              onClick={() => setActiveTab("blocks")}
            >
              <Plus className="h-4 w-4 mr-1" />
              Primitivos
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "layers" ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">DOM Tree</p>
                {nodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">A árvore está vazia.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {treeNodes.map(node => renderLayer(node, 0))}
                  </div>
                )}
              </div>
            ) : activeTab === "sections" ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Seções Prontas</p>
                <div className="grid grid-cols-1 gap-3">
                  {/* Hero Completo */}
                  <div className="border rounded-md p-3 bg-muted/30 cursor-pointer hover:border-primary transition-colors" onClick={() => {
                    const sectionId = crypto.randomUUID();
                    const containerId = crypto.randomUUID();
                    const heroId = crypto.randomUUID();
                    const sortOrder = nodes.filter(n => !n.parent_id).length;
                    setNodes(prev => [
                      ...prev,
                      { id: sectionId, document_id: document.id, parent_id: null, sort_order: sortOrder, ...builderRegistry["section"].defaultProps, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                      { id: containerId, document_id: document.id, parent_id: sectionId, sort_order: 0, ...builderRegistry["container"].defaultProps, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                      { id: heroId, document_id: document.id, parent_id: containerId, sort_order: 0, ...builderRegistry["hero_carousel"].defaultProps, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                    ]);
                  }}>
                    <h4 className="font-semibold text-sm">Hero Banner</h4>
                    <p className="text-xs text-muted-foreground mt-1">Sessão completa de banner principal.</p>
                  </div>
                  {/* FAQ */}
                  <div className="border rounded-md p-3 bg-muted/30 cursor-pointer hover:border-primary transition-colors" onClick={() => {
                    const sectionId = crypto.randomUUID();
                    const containerId = crypto.randomUUID();
                    const faqId = crypto.randomUUID();
                    const sortOrder = nodes.filter(n => !n.parent_id).length;
                    setNodes(prev => [
                      ...prev,
                      { id: sectionId, document_id: document.id, parent_id: null, sort_order: sortOrder, ...builderRegistry["section"].defaultProps, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                      { id: containerId, document_id: document.id, parent_id: sectionId, sort_order: 0, ...builderRegistry["container"].defaultProps, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                      { id: faqId, document_id: document.id, parent_id: containerId, sort_order: 0, ...builderRegistry["faq_accordion"].defaultProps, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                    ]);
                  }}>
                    <h4 className="font-semibold text-sm">Perguntas Frequentes</h4>
                    <p className="text-xs text-muted-foreground mt-1">Grid de respostas e quebra de objeções.</p>
                  </div>
                  {/* Testemunhos */}
                  <div className="border rounded-md p-3 bg-muted/30 cursor-pointer hover:border-primary transition-colors" onClick={() => {
                    const sectionId = crypto.randomUUID();
                    const containerId = crypto.randomUUID();
                    const testId = crypto.randomUUID();
                    const sortOrder = nodes.filter(n => !n.parent_id).length;
                    setNodes(prev => [
                      ...prev,
                      { id: sectionId, document_id: document.id, parent_id: null, sort_order: sortOrder, ...builderRegistry["section"].defaultProps, design_tokens: { backgroundColor: "#f8fafc" }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                      { id: containerId, document_id: document.id, parent_id: sectionId, sort_order: 0, ...builderRegistry["container"].defaultProps, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                      { id: testId, document_id: document.id, parent_id: containerId, sort_order: 0, ...builderRegistry["testimonial_carousel"].defaultProps, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                    ]);
                  }}>
                    <h4 className="font-semibold text-sm">Depoimentos</h4>
                    <p className="text-xs text-muted-foreground mt-1">Carrossel de provas sociais.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Primitivos</p>
                <div className="grid grid-cols-2 gap-2">
                   {Object.values(builderRegistry).map(block => (
                     <Button 
                       key={block.type}
                       variant="outline" 
                       className="h-20 flex-col gap-2 p-2"
                       onClick={() => {
                         const parentNode = nodes.find(n => n.id === selectedNodeId);
                         let targetParentId = null;
                         if (parentNode && (parentNode.block_type === "container" || parentNode.block_type === "section")) {
                           targetParentId = parentNode.id;
                         }

                         const newNode: ExperienceNode = {
                           id: crypto.randomUUID(),
                           ...block.defaultProps,
                           document_id: document.id,
                           parent_id: targetParentId,
                           sort_order: nodes.filter(n => n.parent_id === targetParentId).length,
                           created_at: new Date().toISOString(),
                           updated_at: new Date().toISOString(),
                         };
                         setNodes(prev => [...prev, newNode]);
                         setSelectedNodeId(newNode.id);
                       }}
                     >
                       <span className="text-xs text-center">{block.name}</span>
                     </Button>
                   ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 bg-muted/30 overflow-y-auto flex justify-center p-8">
          <div className="bg-background shadow-xl border w-full max-w-7xl min-h-[800px] flex flex-col relative transition-all">
             <ExperienceRenderer 
               nodes={treeNodes} 
               isEditing={true}
               selectedNodeId={selectedNodeId}
               onSelectNode={setSelectedNodeId}
             />
             {nodes.length === 0 && (
               <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                 <Plus className="h-12 w-12 mb-4 opacity-20" />
                 <p>Arraste um bloco para iniciar a construção.</p>
               </div>
             )}
          </div>
        </main>

        {/* Right Sidebar (Inspector) */}
        <aside className="w-80 border-l bg-card flex flex-col flex-none">
          <div className="h-12 border-b flex items-center px-4 font-semibold text-sm">
            <Settings2 className="h-4 w-4 mr-2" />
            Propriedades
          </div>
          <div className="flex-1 overflow-y-auto p-4">
             {selectedNode && blockManifest ? (
               <div className="space-y-6">
                 {/* Tabs do Inspetor */}
                 <div className="flex bg-muted/50 p-1 rounded-md mb-4 flex-wrap">
                   <Button 
                     variant={inspectorTab === "content" ? "secondary" : "ghost"} 
                     size="sm" 
                     className="flex-1 text-xs" 
                     onClick={() => setInspectorTab("content")}
                   >Conteúdo</Button>
                   <Button 
                     variant={inspectorTab === "connection" ? "secondary" : "ghost"} 
                     size="sm" 
                     className="flex-1 text-xs" 
                     onClick={() => setInspectorTab("connection")}
                   >Conexão</Button>
                   {blockManifest.inspector?.layout && (
                     <Button 
                       variant={inspectorTab === "layout" ? "secondary" : "ghost"} 
                       size="sm" 
                       className="flex-1 text-xs" 
                       onClick={() => setInspectorTab("layout")}
                     >Layout</Button>
                   )}
                   {blockManifest.inspector?.design && (
                     <Button 
                       variant={inspectorTab === "design" ? "secondary" : "ghost"} 
                       size="sm" 
                       className="flex-1 text-xs" 
                       onClick={() => setInspectorTab("design")}
                     >Design</Button>
                   )}
                 </div>

                 {inspectorTab === "content" && (
                   <div className="space-y-3">
                     <h4 className="text-xs font-semibold uppercase text-muted-foreground">Conteúdo Estático</h4>
                     
                     {blockManifest.inspector?.content?.map(field => (
                       <div key={field.name} className="space-y-1.5">
                         <label className="text-xs font-medium">{field.label}</label>
                         {field.type === "textarea" ? (
                           <Textarea 
                             className="text-sm bg-background"
                             value={selectedNode.content?.[field.name] || ""}
                             onChange={(e) => updateSelectedNode("content", field.name, e.target.value)}
                           />
                         ) : field.type === "json" || field.type === "array" ? (
                            <ArrayBuilder
                              label={field.label}
                              value={Array.isArray(selectedNode.content?.[field.name]) ? selectedNode.content[field.name] : []}
                              onChange={(val) => updateSelectedNode("content", field.name, val)}
                              arrayFields={field.arrayFields || []}
                            />
                          ) : field.type === "image" ? (
                            <MediaUploader
                              value={selectedNode.content?.[field.name] || ""}
                              onChange={(val) => updateSelectedNode("content", field.name, val)}
                            />
                          ) : field.type === "color" ? (
                            <ColorPicker
                              value={selectedNode.content?.[field.name] || ""}
                              onChange={(val) => updateSelectedNode("content", field.name, val)}
                            />
                         ) : field.type === "boolean" ? (
                           <input 
                             type="checkbox"
                             checked={selectedNode.content?.[field.name] || false}
                             onChange={(e) => updateSelectedNode("content", field.name, e.target.checked)}
                           />
                         ) : field.type === "number" ? (
                           <Input 
                             type="number"
                             className="h-8 text-sm bg-background"
                             value={selectedNode.content?.[field.name] || ""}
                             onChange={(e) => updateSelectedNode("content", field.name, Number(e.target.value))}
                           />
                         ) : (
                           <Input 
                             className="h-8 text-sm bg-background"
                             value={selectedNode.content?.[field.name] || ""}
                             onChange={(e) => updateSelectedNode("content", field.name, e.target.value)}
                           />
                         )}
                       </div>
                     )) || (
                       <p className="text-sm text-muted-foreground">Este bloco não possui propriedades de conteúdo editáveis.</p>
                     )}
                   </div>
                 )}

                 {inspectorTab === "connection" && (
                   <div className="space-y-4">
                     <h4 className="text-xs font-semibold uppercase text-muted-foreground">Data Binding</h4>
                     <p className="text-sm text-muted-foreground">Conecte este bloco a informações em tempo real da loja.</p>
                     <div className="space-y-2">
                       <label className="text-xs font-medium">Fonte de Dados (Resolver)</label>
                       <select 
                         className="w-full text-sm p-2 border rounded-md bg-background"
                         value={selectedNode.data_bindings?.type || ""}
                         onChange={(e) => {
                           const type = e.target.value;
                           if (!type) {
                             // clear bindings
                             setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, data_bindings: {} } : n));
                           } else {
                             // set basic binding
                             setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, data_bindings: { type } } : n));
                           }
                         }}
                       >
                         <option value="">Nenhuma (Estático)</option>
                         <option value="latest_products">Últimos Produtos Adicionados</option>
                         <option value="product_collection">Produtos por Coleção</option>
                         <option value="category_products">Produtos por Categoria</option>
                       </select>
                     </div>
                     {selectedNode.data_bindings?.type === "product_collection" && (
                       <div className="space-y-2">
                         <label className="text-xs font-medium">Slug da Coleção</label>
                         <Input 
                           placeholder="ex: inverno-26" 
                           className="h-8 text-sm bg-background"
                           value={selectedNode.data_bindings?.collection_slug || ""}
                           onChange={(e) => updateSelectedNode("data_bindings", "collection_slug", e.target.value)}
                         />
                       </div>
                     )}
                   </div>
                 )}

                 {inspectorTab === "layout" && blockManifest.inspector?.layout && (
                   <div className="space-y-3">
                     <h4 className="text-xs font-semibold uppercase text-muted-foreground">Layout & Estrutura</h4>
                     {blockManifest.inspector.layout.map(field => (
                       <div key={field.name} className="space-y-1.5">
                         <label className="text-xs font-medium">{field.label}</label>
                         {field.type === "select" && field.options ? (
                           <select 
                             className="w-full text-sm p-1.5 border rounded-md bg-background"
                             value={selectedNode.layout_rules?.[field.name] || ""}
                             onChange={(e) => updateSelectedNode("layout_rules", field.name, e.target.value)}
                           >
                             {field.options.map(opt => (
                               <option key={opt.value} value={opt.value}>{opt.label}</option>
                             ))}
                           </select>
                         ) : null}
                       </div>
                     ))}
                   </div>
                 )}

                 {inspectorTab === "design" && blockManifest.inspector?.design && (
                   <div className="space-y-3">
                     <h4 className="text-xs font-semibold uppercase text-muted-foreground">Layout e Tokens</h4>
                     {blockManifest.inspector.design.map(field => (
                       <div key={field.name} className="space-y-1.5">
                         <label className="text-xs font-medium">{field.label}</label>
                          {field.type === "color" ? (
                            <ColorPicker 
                              value={selectedNode.design_tokens?.[field.name] || ""}
                              onChange={(val) => updateSelectedNode("design_tokens", field.name, val)}
                            />
                          ) : field.type === "image" ? (
                            <MediaUploader 
                              value={selectedNode.design_tokens?.[field.name] || ""}
                              onChange={(val) => updateSelectedNode("design_tokens", field.name, val)}
                            />
                          ) : null}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4 opacity-50">
                 <Settings2 className="h-10 w-10" />
                 <p className="text-sm">Selecione uma camada para inspecionar propriedades.</p>
               </div>
             )}
          </div>
        </aside>
        
      </div>
    </div>
  );
}

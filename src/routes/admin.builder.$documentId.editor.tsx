import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, GripVertical, Settings2, Eye, Laptop, Smartphone, Save, PanelLeftClose, PanelRightClose, Layers, Braces, AlignLeft } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { getExperienceDocument, saveBuilderNodes } from "@/services/builder.functions";
import type { ExperienceNode } from "@/lib/builder-types";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";

export const Route = createFileRoute("/admin/builder/$documentId/editor")({
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

function BuilderEditorIDE() {
  const { document, version, initialNodes } = Route.useLoaderData();
  const navigate = useNavigate();
  
  const [nodes, setNodes] = useState<ExperienceNode[]>(initialNodes);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"layers" | "blocks">("layers");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"content" | "connection" | "design">("content");

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
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar e Publicar"}
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
              className="flex-1 rounded-sm justify-center"
              onClick={() => setActiveTab("layers")}
            >
              <Layers className="h-4 w-4 mr-2" />
              Camadas
            </Button>
            <Button 
              variant={activeTab === "blocks" ? "secondary" : "ghost"} 
              size="sm" 
              className="flex-1 rounded-sm justify-center"
              onClick={() => setActiveTab("blocks")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "layers" ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">DOM Tree</p>
                {/* Temporary placeholder for Drag and Drop Layer tree */}
                {nodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">A árvore está vazia.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {treeNodes.map(node => (
                      <div 
                        key={node.id} 
                        className={`text-sm py-1.5 px-2 rounded-md flex items-center cursor-pointer ${selectedNodeId === node.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                        onClick={() => setSelectedNodeId(node.id)}
                      >
                        <GripVertical className="h-3 w-3 mr-2 opacity-50" />
                        {node.block_type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Primitivos</p>
                <div className="grid grid-cols-2 gap-2">
                   {/* We will map the registry here */}
                   <Button variant="outline" className="h-20 flex-col gap-2">
                     <AlignLeft className="h-5 w-5" />
                     <span className="text-xs">Seção</span>
                   </Button>
                   <Button variant="outline" className="h-20 flex-col gap-2">
                     <Braces className="h-5 w-5" />
                     <span className="text-xs">Container</span>
                   </Button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 bg-muted/30 overflow-y-auto flex justify-center p-8">
          <div className="bg-background shadow-xl border w-full max-w-7xl min-h-[800px] flex flex-col relative transition-all">
             <ExperienceRenderer nodes={treeNodes} />
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
             {selectedNodeId ? (
               <div className="space-y-6">
                 {/* Tabs do Inspetor */}
                 <div className="flex bg-muted/50 p-1 rounded-md mb-4">
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
                   <Button 
                     variant={inspectorTab === "design" ? "secondary" : "ghost"} 
                     size="sm" 
                     className="flex-1 text-xs" 
                     onClick={() => setInspectorTab("design")}
                   >Design</Button>
                 </div>

                 {inspectorTab === "content" && (
                   <div className="space-y-3">
                     <h4 className="text-xs font-semibold uppercase text-muted-foreground">Conteúdo Estático</h4>
                     <p className="text-sm text-muted-foreground">Defina os textos e imagens manuais deste bloco.</p>
                     {/* Campos dinâmicos do schema seriam renderizados aqui */}
                   </div>
                 )}

                 {inspectorTab === "connection" && (
                   <div className="space-y-4">
                     <h4 className="text-xs font-semibold uppercase text-muted-foreground">Data Binding</h4>
                     <p className="text-sm text-muted-foreground">Conecte este bloco a informações em tempo real da loja.</p>
                     <div className="space-y-2">
                       <label className="text-xs font-medium">Fonte de Dados (Resolver)</label>
                       <select className="w-full text-sm p-2 border rounded-md bg-background">
                         <option value="">Nenhuma (Estático)</option>
                         <option value="latest_products">Últimos Produtos Adicionados</option>
                         <option value="category_products">Produtos por Categoria</option>
                       </select>
                     </div>
                   </div>
                 )}

                 {inspectorTab === "design" && (
                   <div className="space-y-3">
                     <h4 className="text-xs font-semibold uppercase text-muted-foreground">Layout e Tokens</h4>
                     <p className="text-sm text-muted-foreground">Ajuste espaçamento, margens, cores e visibilidade (Mobile/Desktop).</p>
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

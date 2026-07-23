import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { FileText, Plus, Search, Settings, MoreVertical, Link2, LayoutTemplate, Edit3, Trash2, Globe, FileCode, SearchIcon, Sparkles, Building, Smartphone, BarChart3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { listExperienceDocuments, createExperienceDocument, updateExperienceDocument } from "@/services/builder.functions";
import type { ExperienceDocument } from "@/lib/builder-types";

export const Route = createFileRoute("/admin/builder/")({
  head: () => ({ meta: [{ title: "Páginas & Bio Links — Hr Shoes" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ type: (s.type as string) || undefined }),
  loader: async () => {
    const res = await listExperienceDocuments();
    const filtered = res.filter(
      (doc) => doc.document_type !== "storefront"
    );
    return { documents: filtered };
  },
  component: BuilderIndex,
});

function getTypeIcon(type: string) {
  switch (type) {
    case "storefront": return <LayoutTemplate className="h-4 w-4 text-blue-500" />;
    case "biolink": return <Link2 className="h-4 w-4 text-green-500" />;
    case "pwa": return <Smartphone className="h-4 w-4 text-purple-500" />;
    case "campaign": return <FileText className="h-4 w-4 text-orange-500" />;
    default: return <FileText className="h-4 w-4" />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "storefront": return "Loja Virtual";
    case "biolink": return "Bio Link";
    case "pwa": return "PWA App Shell";
    case "campaign": return "Campanha";
    default: return type;
  }
}

function BuilderIndex() {
  const { documents } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Page Settings Dialog State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ExperienceDocument | null>(null);
  const [settingsTitle, setSettingsTitle] = useState("");
  const [settingsSlug, setSettingsSlug] = useState("");
  const [settingsActive, setSettingsActive] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const openSettings = (doc: ExperienceDocument) => {
    setEditingDoc(doc);
    setSettingsTitle(doc.title);
    setSettingsSlug(doc.slug);
    setSettingsActive(doc.is_active);
    setIsSettingsOpen(true);
  };

  const router = useRouter();

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    
    setIsUpdatingSettings(true);
    try {
      await updateExperienceDocument({
        data: {
          id: editingDoc.id,
          title: settingsTitle,
          slug: settingsSlug.toLowerCase().trim(),
          is_active: settingsActive
        }
      });
      toast.success("Configurações atualizadas!");
      setIsSettingsOpen(false);
      await router.invalidate();
    } catch {
      toast.error("Erro inesperado.");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Filter by type (from ?type=biolink redirect) and search query
  const filteredDocs = documents.filter((doc: ExperienceDocument) => {
    const typeMatch = !search.type || doc.document_type === search.type;
    const queryMatch = !searchQuery || doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.slug.includes(searchQuery.toLowerCase());
    return typeMatch && queryMatch;
  });

  const activeTypeLabel = search.type === "biolink" ? "Bio Links" : search.type === "campaign" ? "Campanhas" : undefined;
  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<"biolink" | "campaign" | null>(null);

  const openTemplateModal = (type: "biolink" | "campaign") => {
    setSelectedDocType(type);
    setIsTemplateModalOpen(true);
  };

  const handleCreateDocument = async (
    type: "storefront" | "biolink" | "campaign" | "pwa",
    templateId: string
  ) => {
    setIsCreating(true);
    try {
      let title = "Nova Página";
      let slug = `page-${Date.now()}`;

      if (type === "biolink") {
        title = "Novo Bio Link";
        slug = `link-${Date.now()}`;
      } else if (type === "campaign") {
        title = "Nova Campanha";
        slug = `promo-${Date.now()}`;
      } else if (type === "storefront") {
        title = templateId === "homepage_classic" ? "Home Page" : "Institucional";
        slug = templateId === "homepage_classic" ? "home" : `institucional-${Date.now()}`;
      }
      
      const res = await createExperienceDocument({
        data: {
          title,
          slug,
          document_type: type,
          template_id: templateId
        }
      });
      
      toast.success("Documento criado!");
      navigate({ to: "/admin/builder/$documentId/editor", params: { documentId: res.data.document.id } });
    } catch (e) {
      toast.error("Erro inesperado.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {activeTypeLabel ?? "Páginas & Bio Links"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {search.type === "biolink"
              ? "Gerencie os bio links para o Instagram e afiliadas."
              : "Crie landing pages, campanhas promocionais e bio links para o Instagram."}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isCreating}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Experiência
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Criar Bio Link</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleCreateDocument("biolink", "blank")}>
                <Link2 className="mr-2 h-4 w-4" />
                <span>Em Branco</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateDocument("biolink", "biolink_classic")}>
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                <span>Template Clássico</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Criar Campanha</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleCreateDocument("campaign", "blank")}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Em Branco</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateDocument("campaign", "landing_page")}>
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                <span>Landing Page de Vendas</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Criar Página Padrão</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleCreateDocument("storefront", "homepage_classic")}>
                <LayoutTemplate className="mr-2 h-4 w-4 text-primary" />
                <span>Home Page Clássica</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateDocument("storefront", "institutional_profile")}>
                <Building className="mr-2 h-4 w-4 text-primary" />
                <span>Página Institucional</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar experiências..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDocs.map((doc: ExperienceDocument) => (
          <Card key={doc.id} className="group overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
            {/* Visual Thumbnail Placeholder */}
            <div className="h-32 bg-muted/50 border-b relative flex items-center justify-center">
               {getTypeIcon(doc.document_type)}
               <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur text-foreground border shadow-sm">
                 {getTypeLabel(doc.document_type)}
               </Badge>
            </div>
            <CardContent className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-lg truncate">{doc.title}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-1 mb-4 truncate">/{doc.slug}</p>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(doc.updated_at), "dd MMM, HH:mm", { locale: ptBR })}
                </span>
                
                <div className="flex gap-2">
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-muted-foreground"
                     onClick={() => openSettings(doc)}
                   >
                     <Settings className="h-4 w-4" />
                   </Button>
                   <Button variant="secondary" size="sm" asChild>
                     <Link to="/admin/builder/$documentId/editor" params={{ documentId: doc.id }}>
                       <Edit3 className="h-4 w-4 mr-1.5" />
                       Editar
                     </Link>
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredDocs.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {documents.length === 0
              ? "Nenhuma experiência criada ainda. Use o botão acima para criar."
              : `Nenhum resultado encontrado${activeTypeLabel ? ` em "${activeTypeLabel}"` : ""}.`}
          </div>
        )}
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações da Página</DialogTitle>
            <DialogDescription>
              Atualize o título, o endereço (slug) e a visibilidade desta página extra ou bio link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSettings} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Título da Página</label>
              <Input 
                required 
                placeholder="Ex: Coleção de Verão" 
                value={settingsTitle} 
                onChange={e => setSettingsTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Endereço (Slug)</label>
              <div className="flex items-center">
                <span className="bg-muted border border-r-0 rounded-l-md px-3 py-2 text-sm text-muted-foreground">/</span>
                <Input 
                  required 
                  pattern="^[a-z0-9-]+$"
                  title="Apenas letras minúsculas, números e traços."
                  placeholder="ex: colecao-verao" 
                  className="rounded-l-none"
                  value={settingsSlug} 
                  onChange={e => setSettingsSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Página Ativa</p>
                <p className="text-xs text-muted-foreground">Se desativada, a página retornará 404 para visitantes.</p>
              </div>
              <input 
                type="checkbox" 
                checked={settingsActive} 
                onChange={e => setSettingsActive(e.target.checked)} 
                className="h-5 w-5 accent-primary cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isUpdatingSettings}>
                {isUpdatingSettings ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Escolha um Template</DialogTitle>
            <DialogDescription>
              Selecione um ponto de partida estrutural para sua nova página ou crie do zero.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            <Card className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col" onClick={() => handleCreateDocument(selectedDocType || "storefront", "blank")}>
              <div className="h-32 bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm">Página em Branco</h4>
                <p className="text-xs text-muted-foreground mt-1">Comece do absoluto zero, com um canvas limpo.</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col" onClick={() => handleCreateDocument(selectedDocType || "storefront", "institutional_profile")}>
              <div className="h-32 bg-indigo-50 flex items-center justify-center border-b">
                <Building className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm">Perfil Institucional</h4>
                <p className="text-xs text-muted-foreground mt-1">História, depoimentos e presença da sua marca.</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col" onClick={() => handleCreateDocument(selectedDocType || "storefront", "biolink_classic")}>
              <div className="h-32 bg-slate-100 flex items-center justify-center border-b">
                <Link2 className="h-8 w-8 text-slate-400" />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm">Biolink Clássico</h4>
                <p className="text-xs text-muted-foreground mt-1">Foto de perfil, título, bio e grade de links.</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col" onClick={() => handleCreateDocument(selectedDocType || "storefront", "landing_page")}>
              <div className="h-32 bg-amber-50 flex items-center justify-center border-b">
                <LayoutTemplate className="h-8 w-8 text-amber-400" />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm">Oferta Relâmpago</h4>
                <p className="text-xs text-muted-foreground mt-1">Banner, cronômetro e destaques da coleção.</p>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

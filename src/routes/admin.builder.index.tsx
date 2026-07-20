import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

import { listExperienceDocuments, createExperienceDocument } from "@/services/builder.functions";
import type { ExperienceDocument } from "@/lib/builder-types";

export const Route = createFileRoute("/admin/builder/")({
  head: () => ({ meta: [{ title: "Páginas & Bio Links — Hr Shoes" }] }),
  loader: async () => {
    const res = await listExperienceDocuments();
    if (res.status === "error" || res.status === "unconfigured") {
      throw new Error("Erro ao carregar documentos do Builder");
    }
    // Filtrar vitrine principal para não aparecer aqui
    const filtered = res.data.filter((doc: ExperienceDocument) => doc.document_type !== "storefront");
    return {
      documents: filtered,
    };
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
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  
  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<"biolink" | "campaign" | null>(null);

  const openTemplateModal = (type: "biolink" | "campaign") => {
    setSelectedDocType(type);
    setIsTemplateModalOpen(true);
  };

  const handleCreateDocument = async (templateId: string) => {
    if (!selectedDocType) return;
    
    setIsCreating(true);
    try {
      const title = selectedDocType === "biolink" ? "Novo Bio Link" : "Nova Campanha";
      const slug = selectedDocType === "biolink" ? `link-${Date.now()}` : `promo-${Date.now()}`;
      
      const res = await createExperienceDocument({
        data: {
          title,
          slug,
          document_type: selectedDocType,
          template_id: templateId
        }
      });
      
      if (res.status === "success") {
        toast.success("Documento criado!");
        navigate({ to: "/admin/builder/$documentId/editor", params: { documentId: res.data.document.id } });
      } else {
        toast.error("Erro ao criar documento.");
      }
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
          <h1 className="text-3xl font-bold tracking-tight">Páginas & Bio Links</h1>
          <p className="text-muted-foreground mt-1">
            Crie landing pages, campanhas promocionais e bio links para o Instagram.
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
              <DropdownMenuLabel>O que você quer criar?</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openTemplateModal("biolink")}>
                <Link2 className="mr-2 h-4 w-4" />
                <span>Bio Link (Afiliados/Redes)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTemplateModal("campaign")}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Página de Campanha (Ofertas)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar experiências..." className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {documents.map((doc: ExperienceDocument) => (
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
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
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
        {documents.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhuma experiência criada ainda.
          </div>
        )}
      </div>

      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Escolha um Template</DialogTitle>
            <DialogDescription>
              Selecione um ponto de partida estrutural para sua nova página ou crie do zero.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            <Card className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col" onClick={() => handleCreateDocument("blank")}>
              <div className="h-32 bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm">Página em Branco</h4>
                <p className="text-xs text-muted-foreground mt-1">Comece do absoluto zero, com um canvas limpo.</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col" onClick={() => handleCreateDocument("institutional_profile")}>
              <div className="h-32 bg-indigo-50 flex items-center justify-center border-b">
                <Building className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm">Perfil Institucional</h4>
                <p className="text-xs text-muted-foreground mt-1">História, depoimentos e presença da sua marca.</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col" onClick={() => handleCreateDocument("biolink_classic")}>
              <div className="h-32 bg-slate-100 flex items-center justify-center border-b">
                <Link2 className="h-8 w-8 text-slate-400" />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm">Biolink Clássico</h4>
                <p className="text-xs text-muted-foreground mt-1">Foto de perfil, título, bio e grade de links.</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col" onClick={() => handleCreateDocument("landing_page")}>
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

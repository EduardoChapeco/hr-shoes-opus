import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Store, Instagram, Map, MessageCircle, LayoutTemplate, BookOpen, CheckCircle2 } from "lucide-react";
import { checkExperienceDocumentExists, getOrCreateInstitutionalDocument } from "@/services/builder.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/perfil-publico")({
  head: () => ({ meta: [{ title: "Perfil Público — Hr Shoes" }] }),
  loader: async () => {
    const res = await checkExperienceDocumentExists({ data: { slug: "institucional", document_type: "storefront" } });
    if (res.status === "success" && res.data.exists && res.data.id) {
      throw redirect({
        to: "/admin/builder/$documentId/editor",
        params: { documentId: res.data.id },
      });
    }
    return null;
  },
  component: InstitutionalTemplatePicker,
});

const TEMPLATES = [
  {
    id: "modern_commercial",
    name: "Comercial Moderno",
    description: "Focado em vender. Traz destaques, links para categorias e destaques comerciais.",
    icon: <Store className="w-10 h-10 text-blue-500 mb-4" />,
    features: ["Hero com CTAs", "Categorias em Destaque", "Horários e Mapa"],
  },
  {
    id: "social_link_tree",
    name: "Estilo Instagram",
    description: "Layout vertical ideal para colocar no link da bio. Foco em botões e links rápidos.",
    icon: <Instagram className="w-10 h-10 text-pink-500 mb-4" />,
    features: ["Avatar Redondo", "Lista de Links", "Destaque Social"],
  },
  {
    id: "local_business",
    name: "Negócio Local",
    description: "Foco absoluto em atrair o cliente para a loja física. Mapa e horários em evidência.",
    icon: <Map className="w-10 h-10 text-orange-500 mb-4" />,
    features: ["Mapa Destacado", "Botão Rota", "Informações Visíveis"],
  },
  {
    id: "whatsapp_catalog",
    name: "Catálogo WhatsApp",
    description: "Direciona todas as ações para conversar com um vendedor no WhatsApp.",
    icon: <MessageCircle className="w-10 h-10 text-green-500 mb-4" />,
    features: ["Botões WhatsApp", "Produtos Rápidos", "Contato Direto"],
  },
  {
    id: "brand_history",
    name: "Nossa História",
    description: "Conta a história da marca, valores e missão. Ideal para reforçar autoridade.",
    icon: <BookOpen className="w-10 h-10 text-purple-500 mb-4" />,
    features: ["Linha do Tempo", "Missão e Valores", "Depoimentos"],
  },
  {
    id: "blank",
    name: "Em Branco",
    description: "Comece do zero e construa seu perfil bloco por bloco.",
    icon: <LayoutTemplate className="w-10 h-10 text-muted-foreground mb-4" />,
    features: ["Total Liberdade", "Canvas Limpo"],
  }
];

function InstitutionalTemplatePicker() {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (templateId: string) => {
    try {
      setIsCreating(true);
      const res = await getOrCreateInstitutionalDocument({ data: { template_id: templateId } });
      toast.success("Perfil Institucional criado com sucesso!");
      navigate({
        to: "/admin/builder/$documentId/editor",
        params: { documentId: res.data.id },
      });
    } catch (e: any) {
      toast.error("Falha ao criar perfil: " + e.message);
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Criar Perfil Institucional</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Sua loja ainda não possui um perfil institucional publicado. Escolha um template inicial para começar. 
          Você poderá alterar tudo no editor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((tpl) => (
          <Card 
            key={tpl.id} 
            className="flex flex-col relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => !isCreating && handleCreate(tpl.id)}
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              {tpl.icon}
              <CardTitle>{tpl.name}</CardTitle>
              <CardDescription className="min-h-[60px]">{tpl.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {tpl.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" disabled={isCreating}>
                {isCreating ? "Criando..." : "Usar este template"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

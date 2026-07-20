import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { checkExperienceDocumentExists, getOrCreateHomeDocument } from "@/services/builder.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutTemplate, Sparkles, MonitorSmartphone, Palette, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/vitrine")({
  loader: async () => {
    const res = await checkExperienceDocumentExists({ data: { slug: "home", document_type: "storefront" } });
    if (res.status === "success" && res.data.exists && res.data.id) {
      throw redirect({
        to: "/admin/builder/$documentId/editor",
        params: { documentId: res.data.id },
      });
    }
    return null;
  },
  component: VitrineTemplatePicker,
});

const TEMPLATES = [
  {
    id: "classic_commerce",
    name: "Clássico E-commerce",
    description: "Layout tradicional com banner principal, destaques em carrossel e banners promocionais.",
    icon: <LayoutTemplate className="w-10 h-10 text-blue-500 mb-4" />,
    features: ["Hero Carousel", "Carrossel de Produtos", "Banner Promocional"],
  },
  {
    id: "minimalist_fashion",
    name: "Minimalista & Moda",
    description: "Foco no produto e imagens grandes. Ideal para coleções exclusivas e marcas boutique.",
    icon: <Palette className="w-10 h-10 text-purple-500 mb-4" />,
    features: ["Split Banner", "Grid de Produtos", "Espaço Negativo"],
  },
  {
    id: "street_wear",
    name: "Streetwear & Dark",
    description: "Tema escuro nativo, visual agressivo e galeria estilo instagram. Focado em lançamentos.",
    icon: <Sparkles className="w-10 h-10 text-slate-800 mb-4" />,
    features: ["Dark Mode Nativo", "Galeria de Fotos", "Destaque de Lançamentos"],
  },
  {
    id: "blank",
    name: "Em Branco",
    description: "Comece do zero absoluto e construa sua vitrine bloco por bloco.",
    icon: <MonitorSmartphone className="w-10 h-10 text-muted-foreground mb-4" />,
    features: ["Tela Limpa", "Total Liberdade"],
  }
];

function VitrineTemplatePicker() {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (templateId: string) => {
    try {
      setIsCreating(true);
      const res = await getOrCreateHomeDocument({ data: { template_id: templateId } });
      if (res.status === "success" && res.data?.id) {
        toast.success("Vitrine criada com sucesso!");
        navigate({
          to: "/admin/builder/$documentId/editor",
          params: { documentId: res.data.id },
        });
      } else {
        throw new Error(res.message || "Erro desconhecido");
      }
    } catch (e: any) {
      toast.error("Falha ao criar vitrine: " + e.message);
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Criar Vitrine Principal</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Sua loja ainda não possui uma vitrine publicada. Escolha um template inicial para começar. 
          Não se preocupe, você poderá alterar tudo no editor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

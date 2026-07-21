import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Globe } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStoreSeo, saveStoreSeo } from "@/services/store.functions";

export const Route = createFileRoute("/admin/configuracoes/seo")({
  head: () => ({ meta: [{ title: "SEO — Hr Shoes" }] }),
  loader: async () => {
    return await getStoreSeo();
  },
  component: SeoPage,
});

function SeoPage() {
  const res = Route.useLoaderData();
  const router = useRouter();
  const initial =
    res || { seo_title: "", seo_description: "", seo_keywords: "" };
  const [form, setForm] = useState({
    seo_title: (initial as any).seo_title || "",
    seo_description: (initial as any).seo_description || "",
    seo_keywords: (initial as any).seo_keywords || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveStoreSeo({ data: form });
      toast.success("Configurações de SEO salvas!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações de SEO"
        description="Defina os metadados que aparecem no Google e redes sociais."
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="seo-title">
            Título da Loja para SEO
            <span className="ml-2 text-xs text-muted-foreground">
              ({form.seo_title.length}/60 chars)
            </span>
          </Label>
          <Input
            id="seo-title"
            placeholder="Hr Shoes — Moda Feminina com Conforto"
            value={form.seo_title}
            onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">
            Aparece como título nos resultados de busca do Google.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-desc">
            Descrição Meta
            <span className="ml-2 text-xs text-muted-foreground">
              ({form.seo_description.length}/160 chars)
            </span>
          </Label>
          <Textarea
            id="seo-desc"
            placeholder="Descubra as últimas tendências em calçados e roupas femininas na Hr Shoes..."
            value={form.seo_description}
            onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
            maxLength={160}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Aparece como resumo nos resultados de busca.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-keywords">Palavras-chave</Label>
          <Input
            id="seo-keywords"
            placeholder="calçados femininos, moda feminina, sapatos..."
            value={form.seo_keywords}
            onChange={(e) => setForm((f) => ({ ...f, seo_keywords: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Separadas por vírgula. Impacto menor nos motores de busca modernos, mas ainda útil.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Preview no Google
          </div>
          <p className="text-sm text-blue-600 font-medium truncate">
            {form.seo_title || "Hr Shoes — Moda Feminina"}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {form.seo_description || "Descrição da loja..."}
          </p>
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar SEO"}
        </Button>
      </form>
    </div>
  );
}

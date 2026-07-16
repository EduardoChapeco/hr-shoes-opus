import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Globe } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getServerClient } from "@/lib/supabase";

const getStoreSeo = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const { data: store } = await db
      .from("stores")
      .select("id, seo_title, seo_description, seo_keywords")
      .limit(1)
      .single();
    if (!store) return { status: "unconfigured" as const };
    return { status: "ok" as const, data: store };
  } catch {
    return { status: "error" as const, message: "Erro ao carregar SEO." };
  }
});

const saveStoreSeo = createServerFn({ method: "POST" })
  .validator(
    z.object({
      seo_title: z.string().max(60),
      seo_description: z.string().max(160),
      seo_keywords: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = getServerClient();
    const { data: store } = await db.from("stores").select("id").limit(1).single();
    if (!store) throw new Error("Loja não encontrada");
    const { error } = await db.from("stores").update(data).eq("id", store.id);
    if (error) throw new Error(error.message);
    return { status: "success" };
  });

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
    res.status === "ok" ? res.data : { seo_title: "", seo_description: "", seo_keywords: "" };
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
      const res = await saveStoreSeo({ data: form });
      if (res.status === "error") throw new Error(res.message);
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

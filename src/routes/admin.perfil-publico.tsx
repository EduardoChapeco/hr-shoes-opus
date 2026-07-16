import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Store, MapPin, Phone, Clock } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getServerClient } from "@/lib/supabase";
import { useRouter } from "@tanstack/react-router";

const getPublicProfile = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const { data: store, error } = await db
      .from("stores")
      .select("id, name, description, logo_url, address, phone, business_hours, social_links")
      .limit(1)
      .single();
    if (error || !store) return { status: "unconfigured" as const };
    return { status: "ok" as const, data: store };
  } catch {
    return { status: "error" as const, message: "Erro ao carregar perfil." };
  }
});

const savePublicProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({
      description: z.string().max(500),
      phone: z.string().max(20).optional(),
      address: z.string().max(200).optional(),
      business_hours: z.string().max(200).optional(),
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

export const Route = createFileRoute("/admin/perfil-publico")({
  head: () => ({ meta: [{ title: "Perfil Público — Hr Shoes" }] }),
  loader: async () => {
    return await getPublicProfile();
  },
  component: PerfilPublicoPage,
});

function PerfilPublicoPage() {
  const res = Route.useLoaderData();
  const router = useRouter();
  const store = res.status === "ok" ? res.data : null;
  const [form, setForm] = useState({
    description: (store as any)?.description || "",
    phone: (store as any)?.phone || "",
    address: (store as any)?.address || "",
    business_hours: (store as any)?.business_hours || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await savePublicProfile({ data: form });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Perfil público atualizado!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  if (!store) {
    return (
      <div className="space-y-6">
        <PageHeader title="Perfil Público da Loja" description="Informações exibidas na vitrine." />
        <p className="text-muted-foreground text-sm">Loja não configurada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Perfil Público da Loja"
          description="Informações exibidas na página /perfil-da-loja e na vitrine."
        />
        <Button variant="outline" size="sm" asChild>
          <Link to="/perfil-da-loja">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver na Vitrine
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            {(store as any).logo_url && (
              <img
                src={(store as any).logo_url}
                alt={(store as any).name}
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-semibold text-lg">{(store as any).name}</p>
              <p className="text-xs text-muted-foreground">Prévia do perfil público</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {form.description || "Sem descrição definida."}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="store-desc">Descrição da Loja</Label>
            </div>
            <Textarea
              id="store-desc"
              rows={3}
              placeholder="Conte a história da sua loja..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="store-phone">Telefone / WhatsApp</Label>
            </div>
            <Input
              id="store-phone"
              type="tel"
              placeholder="(49) 99999-9999"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="store-address">Endereço</Label>
            </div>
            <Input
              id="store-address"
              placeholder="Rua Exemplo, 123 — Chapecó, SC"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="store-hours">Horários de Funcionamento</Label>
            </div>
            <Input
              id="store-hours"
              placeholder="Seg-Sex 9h-18h, Sáb 9h-13h"
              value={form.business_hours}
              onChange={(e) => setForm((f) => ({ ...f, business_hours: e.target.value }))}
            />
          </div>

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? "Salvando..." : "Salvar Perfil"}
          </Button>
        </form>
      </div>
    </div>
  );
}

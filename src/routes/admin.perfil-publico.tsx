import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Store, MapPin, Phone, Clock, Image as ImageIcon } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { getPublicProfile, savePublicProfile } from "@/services/store.functions";

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
    logo_url: (store as any)?.logo_url || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await savePublicProfile({ data: form });
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
        {/* Preview Card */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Prévia do Perfil Público
          </h3>
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt={(store as any).name}
                className="h-16 w-16 rounded-xl object-cover border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Store className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <p className="font-bold text-lg">{(store as any).name}</p>
              <p className="text-xs text-muted-foreground">/{ (store as any).slug }</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            {form.description ? (
              <p className="italic">"{form.description}"</p>
            ) : (
              <p className="text-destructive/80">Sem descrição definida.</p>
            )}
            <div className="border-t pt-2 mt-2 space-y-1.5 text-xs">
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {form.phone || <span className="text-destructive/80">Telefone não definido</span>}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {form.address || <span className="text-destructive/80">Endereço não definido</span>}
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {form.business_hours || <span className="text-destructive/80">Horário não definido</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-5 rounded-lg border bg-card p-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <Label>Logotipo da Loja</Label>
            </div>
            <ImageUpload
              value={form.logo_url}
              onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))}
              onRemove={() => setForm((f) => ({ ...f, logo_url: "" }))}
              bucket="cms-media"
            />
          </div>

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

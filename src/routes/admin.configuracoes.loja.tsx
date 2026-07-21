import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoreSettings, saveStoreSettings } from "@/services/store.functions";
import { MediaUploader } from "@/components/admin/builder/MediaUploader";

export const Route = createFileRoute("/admin/configuracoes/loja")({
  head: () => ({ meta: [{ title: "Dados da Loja — Hr Shoes" }] }),
  loader: async () => {
    return await getStoreSettings();
  },
  component: StoreSettings,
});

function StoreSettings() {
  const res = Route.useLoaderData();
  const router = useRouter();
  const store = res.status === "ok" ? res.data : null;
  const [form, setForm] = useState({
    name: (store as any)?.name || "",
    email: (store as any)?.email || "",
    cnpj: (store as any)?.cnpj || "",
    city: (store as any)?.city || "",
    state: (store as any)?.state || "",
    zip_code: (store as any)?.zip_code || "",
    logoUrl: (store as any)?.settings?.logoUrl || "",
    faviconUrl: (store as any)?.settings?.faviconUrl || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveStoreSettings({ data: form });
      toast.success("Dados da loja salvos!");
      router.invalidate();
    } catch (e: any) {
      let msg = e.message || "Erro ao salvar";
      try {
        const parsed = JSON.parse(e.message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          msg = parsed.map((p: any) => p.message).join(", ");
        }
      } catch {}
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const update =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configurações"
        title="Dados da Loja"
        description="Nome, contato, endereço e identidade da Hr Shoes."
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <Card className="rounded-xl border border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground">Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="store-name">Nome da Loja *</Label>
                <Input
                  id="store-name"
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Hr Shoes"
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-cnpj">CNPJ</Label>
                <Input
                  id="store-cnpj"
                  value={form.cnpj}
                  onChange={update("cnpj")}
                  placeholder="00.000.000/0001-00"
                  maxLength={18}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground">Identidade Visual</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Logotipo da Loja</Label>
                <MediaUploader
                  value={form.logoUrl}
                  onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
                  bucket="cms-media"
                />
                <p className="text-xs text-muted-foreground mt-1">Imagem retangular, preferencialmente transparente (PNG/SVG).</p>
              </div>
              <div className="space-y-2">
                <Label>Ícone da Aba (Favicon)</Label>
                <MediaUploader
                  value={form.faviconUrl}
                  onChange={(url) => setForm((f) => ({ ...f, faviconUrl: url }))}
                  bucket="cms-media"
                />
                <p className="text-xs text-muted-foreground mt-1">Imagem quadrada, ex: 64x64 (PNG/SVG).</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground">Contato Comercial</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label htmlFor="store-email">E-mail administrativo de contato</Label>
              <Input
                id="store-email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="contato@hrshoes.com.br"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground">Origem Logística (Faturamento)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="store-city">Cidade</Label>
                <Input
                  id="store-city"
                  value={form.city}
                  onChange={update("city")}
                  placeholder="Chapecó"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-state">UF</Label>
                <Input
                  id="store-state"
                  value={form.state}
                  onChange={update("state")}
                  placeholder="SC"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-zip">CEP</Label>
                <Input
                  id="store-zip"
                  value={form.zip_code}
                  onChange={update("zip_code")}
                  placeholder="89800-000"
                  maxLength={9}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSaving} size="lg" className="w-full font-bold">
          {isSaving ? "Salvando..." : "Salvar Dados da Loja"}
        </Button>
      </form>
    </div>
  );
}


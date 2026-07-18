import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStoreSettings, saveStoreSettings } from "@/services/store.functions";

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
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground border-b pb-2 w-full">
            Informações Gerais
          </legend>
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
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground border-b pb-2 w-full">
            Contato Comercial
          </legend>
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
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground border-b pb-2 w-full">
            Origem Logística (Faturamento)
          </legend>
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
        </fieldset>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Dados"}
        </Button>
      </form>
    </div>
  );
}

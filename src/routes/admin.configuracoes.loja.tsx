import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";

const getStoreSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const { data: store, error } = await db
      .from("stores")
      .select("id, name, slug, email, phone, cnpj, address, city, state, zip_code, description")
      .limit(1)
      .single();
    if (error || !store) return { status: "not_found" as const };
    return { status: "ok" as const, data: store };
  } catch {
    return { status: "error" as const, message: "Erro ao carregar dados da loja." };
  }
});

const saveStoreSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2).max(100),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().max(20).optional(),
      cnpj: z.string().max(18).optional(),
      address: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(2).optional(),
      zip_code: z.string().max(9).optional(),
      description: z.string().max(500).optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const ssrClient = getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autorizado");

      const db = getServerClient();
      const { data: profile } = await db
        .from("profiles")
        .select("role, store_id")
        .eq("id", user.id)
        .single();
      if (!profile?.store_id || !["owner", "admin"].includes(profile.role)) {
        throw new Error("Apenas proprietários podem editar dados da loja");
      }

      const { error } = await db.from("stores").update(data).eq("id", profile.store_id);
      if (error) throw new Error(error.message);
      return { status: "success" };
    } catch (e: any) {
      return { status: "error" as const, message: e.message };
    }
  });

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
    phone: (store as any)?.phone || "",
    cnpj: (store as any)?.cnpj || "",
    address: (store as any)?.address || "",
    city: (store as any)?.city || "",
    state: (store as any)?.state || "",
    zip_code: (store as any)?.zip_code || "",
    description: (store as any)?.description || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await saveStoreSettings({ data: form });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Dados da loja salvos!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
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
          <div className="space-y-2">
            <Label htmlFor="store-desc">Descrição da Loja</Label>
            <Textarea
              id="store-desc"
              rows={3}
              value={form.description}
              onChange={update("description")}
              placeholder="Uma breve descrição da sua loja..."
              maxLength={500}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground border-b pb-2 w-full">
            Contato
          </legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store-email">E-mail de contato</Label>
              <Input
                id="store-email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="contato@hrshoes.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-phone">Telefone / WhatsApp</Label>
              <Input
                id="store-phone"
                type="tel"
                value={form.phone}
                onChange={update("phone")}
                placeholder="(49) 99999-9999"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground border-b pb-2 w-full">
            Endereço
          </legend>
          <div className="space-y-2">
            <Label htmlFor="store-address">Logradouro</Label>
            <Input
              id="store-address"
              value={form.address}
              onChange={update("address")}
              placeholder="Rua Exemplo, 123"
            />
          </div>
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

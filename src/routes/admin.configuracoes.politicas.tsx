import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, FileText } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPolicies, savePolicies } from "@/services/store.functions";

export const Route = createFileRoute("/admin/configuracoes/politicas")({
  head: () => ({ meta: [{ title: "Políticas da Loja — Hr Shoes" }] }),
  loader: async () => {
    return await getPolicies();
  },
  component: PoliticasPage,
});

function PoliticasPage() {
  const res = Route.useLoaderData();
  const router = useRouter();
  const initial = res && "policies" in res ? (res.policies as any) || {} : {};
  const [form, setForm] = useState({
    privacy_policy: initial.privacy_policy || "",
    return_policy: initial.return_policy || "",
    terms: initial.terms || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await savePolicies({ data: form });
      toast.success("Políticas salvas com sucesso!");
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
        title="Políticas da Loja"
        description="Configure as políticas exibidas para os seus clientes na vitrine."
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="privacy-policy">Política de Privacidade</Label>
          </div>
          <Textarea
            id="privacy-policy"
            rows={8}
            placeholder="Descreva como os dados dos clientes são coletados e utilizados..."
            value={form.privacy_policy}
            onChange={(e) => setForm((f) => ({ ...f, privacy_policy: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="return-policy">Política de Trocas e Devoluções</Label>
          </div>
          <Textarea
            id="return-policy"
            rows={8}
            placeholder="Descreva as condições para trocas, devoluções e prazos..."
            value={form.return_policy}
            onChange={(e) => setForm((f) => ({ ...f, return_policy: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="terms">Termos de Uso</Label>
          </div>
          <Textarea
            id="terms"
            rows={8}
            placeholder="Termos e condições gerais de uso da loja..."
            value={form.terms}
            onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
          />
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Políticas"}
        </Button>
      </form>
    </div>
  );
}

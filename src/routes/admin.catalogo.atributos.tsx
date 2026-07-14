import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Settings2 } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { listProductTypes, createProductType } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/atributos")({
  head: () => ({ meta: [{ title: "Tipos de Produto — Hr Shoes" }] }),
  loader: async () => {
    const res = await listProductTypes();
    if (res.status === "error") throw new Error(res.message);
    if (res.status === "unconfigured") return [];
    return res.data || [];
  },
  component: AtributosPage,
});

function AtributosPage() {
  const types = Route.useLoaderData() as any[];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await createProductType({
        data: {
          name: form.name,
          slug: form.slug
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
          field_schema: [],
        },
      });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Tipo de produto criado!");
      setOpen(false);
      setForm({ name: "", slug: "" });
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tipos de Produto e Atributos"
          description="Defina os tipos (Calçado, Roupa, Acessório) e seus campos customizados."
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Tipo de Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type-name">Nome</Label>
                <Input
                  id="type-name"
                  placeholder="Ex: Calçado Feminino"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: name
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    }));
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type-slug">Slug (identificador único)</Label>
                <Input
                  id="type-slug"
                  placeholder="calcado-feminino"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                  pattern="[a-z0-9-]+"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {types.length === 0 ? (
        <EmptyState
          title="Nenhum tipo de produto"
          description="Crie tipos de produto para definir os atributos específicos de cada categoria."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {types.map((t: any) => (
            <div
              key={t.id}
              className="rounded-lg border bg-card p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Settings2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{t.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {(t.field_schema || []).length} campo(s) definido(s)
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

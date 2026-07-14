import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getNavigationMenus, upsertNavigationMenu } from "@/services/cms.functions";

export const Route = createFileRoute("/admin/cms/navegacao")({
  head: () => ({ meta: [{ title: "Navegação — Hr Shoes" }] }),
  loader: async () => {
    const res = await getNavigationMenus();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: NavigationMenusPage,
});

function NavigationMenusPage() {
  const menus = Route.useLoaderData() || [];

  // If no menus exist, we will show default forms for "header" and "footer"
  const headerMenu = menus.find((m: any) => m.handle === "header") || { handle: "header", name: "Menu Principal", items: [] };
  const footerMenu = menus.find((m: any) => m.handle === "footer") || { handle: "footer", name: "Rodapé", items: [] };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Navegação da Loja"
        description="Construa os menus que aparecem no cabeçalho e rodapé da sua vitrine."
      />

      <MenuEditor menu={headerMenu} title="Menu Principal (Cabeçalho)" description="Aparece no topo de todas as páginas." />
      <MenuEditor menu={footerMenu} title="Menu Secundário (Rodapé)" description="Aparece no fim de todas as páginas." />
    </div>
  );
}

function MenuEditor({ menu, title, description }: { menu: any; title: string; description: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      items: menu.items.length > 0 ? menu.items : [{ label: "", url: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await upsertNavigationMenu({
        data: {
          id: menu.id,
          handle: menu.handle,
          name: menu.name,
          items: values.items.filter((i: any) => i.label && i.url), // remove empty
        },
      });

      if (res.status === "success") {
        toast.success(`${title} salvo com sucesso!`);
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar menu");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Nome do Link</Label>
                  <Input {...register(`items.${index}.label`)} placeholder="Ex: Tênis Esportivos" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Destino (URL)</Label>
                  <Input {...register(`items.${index}.url`)} placeholder="Ex: /categoria/esportivos" />
                </div>
                <Button type="button" variant="ghost" size="icon" className="mb-0.5 text-destructive" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t mt-6">
            <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", url: "" })}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Link
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Menu"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

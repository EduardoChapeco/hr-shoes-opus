import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getLinkInBio, upsertLinkInBio } from "@/services/cms.functions";

export const Route = createFileRoute("/admin/link-da-bio")({
  head: () => ({ meta: [{ title: "Link da Bio — Hr Shoes" }] }),
  loader: async () => {
    const res = await getLinkInBio();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: LinkInBioPage,
});

function LinkInBioPage() {
  const profile = Route.useLoaderData();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      title: profile.title || "",
      description: profile.description || "",
      avatar_url: profile.avatar_url || "",
      links: profile.links && profile.links.length > 0 ? profile.links : [{ label: "", url: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "links",
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await upsertLinkInBio({
        data: {
          title: values.title,
          description: values.description,
          avatar_url: values.avatar_url,
          links: values.links.filter((i: any) => i.label && i.url), // remove empty
        },
      });

      if (res.status === "success") {
        toast.success("Perfil público atualizado com sucesso!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Perfil Público (Link da Bio)"
        description="Configure a página agregadora de links para colocar no seu Instagram ou TikTok."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Perfil</CardTitle>
            <CardDescription>A foto e os textos que aparecem no topo da página.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Foto de Perfil (URL)</Label>
              <Input {...register("avatar_url")} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Título (Nome da Loja)</Label>
              <Input {...register("title", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição (Bio)</Label>
              <Textarea {...register("description")} placeholder="Bem vindo à nossa loja!" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Botões e Links</CardTitle>
            <CardDescription>Os botões em destaque que os clientes podem clicar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md">
                  <div className="flex-1 space-y-2">
                    <Label>Texto do Botão</Label>
                    <Input {...register(`links.${index}.label`)} placeholder="Ex: Falar no WhatsApp" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>URL de Destino</Label>
                    <Input {...register(`links.${index}.url`)} placeholder="https://..." />
                  </div>
                  <Button type="button" variant="outline" size="icon" className="mb-0.5 text-destructive" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Button type="button" variant="secondary" onClick={() => append({ label: "", url: "" })}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Botão
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Perfil Público"}
          </Button>
        </div>
      </form>
    </div>
  );
}

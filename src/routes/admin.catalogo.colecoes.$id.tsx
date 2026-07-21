import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCollectionById, updateCollection } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/colecoes/$id")({
  head: () => ({ meta: [{ title: "Editar Coleção — Hr Shoes" }] }),
  loader: async ({ params }) => {
    const res = await getCollectionById({ data: { id: params.id } });
    return res;
  },
  component: EditCollectionPage,
});

function EditCollectionPage() {
  const collection = Route.useLoaderData();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: collection.name,
      slug: collection.slug,
      status: collection.status,
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await updateCollection({
        data: {
          id: collection.id,
          name: values.name,
          slug: values.slug,
          status: values.status,
        },
      });

      if (res) {
        toast.success("Coleção atualizada com sucesso!");
        navigate({ to: "/admin/catalogo/colecoes" });
      } else {
        toast.error(res.message || "Erro ao atualizar coleção");
      }
    } catch (e) {
      toast.error("Erro inesperado ao salvar alterações");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader
        eyebrow="Catálogo"
        title={`Editar Coleção: ${collection.name}`}
        description="Atualize os dados desta coleção curada."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/catalogo/colecoes">
              <ArrowLeft className="mr-2 size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Básicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Coleção</Label>
              <Input
                {...register("name", { required: "Obrigatório" })}
                onChange={(e) => {
                  register("name").onChange(e);
                  const slug = e.target.value
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");
                  setValue("slug", slug);
                }}
              />
              {errors.name?.message && <p className="text-xs text-destructive">{String(errors.name.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input {...register("slug", { required: "Obrigatório" })} />
              {errors.slug?.message && <p className="text-xs text-destructive">{String(errors.slug.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                defaultValue={collection.status}
                onValueChange={(v) => setValue("status", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                  <SelectItem value="archived">Arquivada (Arquivo Morto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" asChild>
            <Link to="/admin/catalogo/colecoes">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}

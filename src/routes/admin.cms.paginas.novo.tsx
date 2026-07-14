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
import { createPage } from "@/services/cms.functions";

export const Route = createFileRoute("/admin/cms/paginas/novo")({
  head: () => ({ meta: [{ title: "Nova Página — Hr Shoes" }] }),
  component: NewPage,
});

function NewPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{
    title: string;
    slug: string;
    status: "published" | "draft" | "archived";
    seo_title: string;
    seo_description: string;
  }>({
    defaultValues: {
      title: "",
      slug: "",
      status: "draft",
      seo_title: "",
      seo_description: "",
    },
  });

  const onSubmit = async (values: {
    title: string;
    slug: string;
    status: "published" | "draft" | "archived";
    seo_title: string;
    seo_description: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await createPage({ data: values });
      if (res.status === "error") throw new Error(res.message);

      toast.success("Página criada com sucesso!");
      navigate({ to: `/admin/cms/paginas/${res.data.id}/editor` });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar página");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/admin/cms/paginas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Nova Página"
          description="Crie uma nova página institucional para a loja."
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da página</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título interno</Label>
              <Input
                {...register("title", { required: "Obrigatório" })}
                placeholder="Ex: Sobre Nós"
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Slug da URL</Label>
              <Input
                {...register("slug", {
                  required: "Obrigatório",
                  pattern: { value: /^[a-z0-9-]+$/, message: "Apenas minúsculas, números e hífen" },
                })}
                placeholder="ex: sobre-nos"
              />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status inicial</Label>
              <Select
                onValueChange={(v) => setValue("status", v as "published" | "draft" | "archived")}
                defaultValue={watch("status")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho (invisível)</SelectItem>
                  <SelectItem value="published">Publicado (visível)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título da aba (SEO Title)</Label>
              <Input
                {...register("seo_title")}
                placeholder="Ex: Conheça a Hr Shoes | Nossa História"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (Meta Description)</Label>
              <Input
                {...register("seo_description")}
                placeholder="Ex: Saiba mais sobre a nossa marca..."
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar página e ir para o editor"}
        </Button>
      </form>
    </div>
  );
}

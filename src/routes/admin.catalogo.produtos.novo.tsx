import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { createProduct, listCategories } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/produtos/novo")({
  head: () => ({ meta: [{ title: "Criação Rápida — Hr Shoes" }] }),
  loader: async () => {
    const catsRes = await listCategories();
    return {
      categories: catsRes.status === "ok" ? catsRes.data : [],
    };
  },
  component: QuickNewProductPage,
});

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function QuickNewProductPage() {
  const { categories } = Route.useLoaderData();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Imagem principal única para criação rápida
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      slug: "",
      price_cents: "",
      status: "draft",
      category_id: "none",
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const priceCents = parseInt(values.price_cents.replace(/\D/g, ""), 10) || 0;
      
      const res = await createProduct({
        data: {
          title: values.title,
          slug: values.slug || slugify(values.title),
          price_cents: priceCents,
          status: values.status as "draft" | "published" | "archived",
          category_ids: values.category_id !== "none" ? [values.category_id] : [],
          media_urls: mainImageUrl ? [mainImageUrl] : [],
          is_physical: true,
          type_id: null,
          attributes: {},
        },
      });

      if (res.status === "success") {
        toast.success("Rascunho criado! Redirecionando para o editor completo...");
        navigate({ to: "/admin/catalogo/produtos/$id", params: { id: res.data.id } });
      } else {
        toast.error(res.message || "Erro ao criar produto");
        setIsSubmitting(false);
      }
    } catch (e: unknown) {
      toast.error("Erro inesperado ao salvar produto");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <PageHeader
        eyebrow="Catálogo / Produtos"
        title="Criação Rápida de Produto"
        description="Preencha o básico para salvar um rascunho. Você será redirecionado para o editor completo para definir estoque e mídias adicionais."
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/catalogo/produtos" })}>
              <ArrowLeft className="mr-2 size-4" /> Cancelar
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="min-w-32">
              {isSubmitting ? "Criando..." : (
                <>
                  <CheckCircle2 className="size-4 mr-2" /> Salvar & Continuar
                </>
              )}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Principais</CardTitle>
            <CardDescription>Apenas o necessário para iniciar o cadastro no catálogo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nome do produto *</Label>
              <Input
                {...register("title", { required: "Obrigatório" })}
                className="h-11 text-base font-medium"
                placeholder="Ex: Tênis Runner Pro Masculino Preto"
                autoFocus
                onChange={(e) => {
                  register("title").onChange(e);
                  const slug = slugify(e.target.value);
                  setValue("slug", slug);
                }}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message as string}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Preço Base (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground font-medium">R$</span>
                  <Input
                    {...register("price_cents", { required: "Obrigatório" })}
                    className="pl-9 h-11 text-lg font-bold text-primary"
                    placeholder="0,00"
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "");
                      if (v) v = (parseInt(v, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                      e.target.value = v;
                      register("price_cents").onChange(e);
                    }}
                  />
                </div>
                {errors.price_cents && <p className="text-xs text-destructive">{errors.price_cents.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Categoria Principal</Label>
                <Select defaultValue="none" onValueChange={(val) => setValue("category_id", val)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Categoria</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Foto de Capa Inicial (Opcional)</Label>
              <div className="p-4 border rounded-xl bg-muted/20">
                {mainImageUrl ? (
                  <div className="flex gap-4 items-center">
                    <img src={mainImageUrl} alt="Capa" className="size-20 rounded-lg object-cover border" />
                    <Button type="button" variant="outline" size="sm" onClick={() => setMainImageUrl(null)}>Remover</Button>
                  </div>
                ) : (
                  <ImageUpload 
                    bucket="product-media" 
                    onChange={(url) => setMainImageUrl(url)}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Você poderá adicionar mais fotos e vídeos na próxima etapa.</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">URL Automática</Label>
              <div className="flex items-center">
                <span className="bg-muted px-3 border border-r-0 rounded-l-md h-9 text-xs text-muted-foreground flex items-center">
                  /produto/
                </span>
                <Input {...register("slug")} className="h-9 rounded-l-none text-xs bg-muted/30 text-muted-foreground" readOnly />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

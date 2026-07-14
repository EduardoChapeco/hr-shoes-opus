import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, X } from "lucide-react";

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
import { listProductTypes, createProduct } from "@/services/admin-catalog.functions";
import { getBrowserClient } from "@/lib/supabase";

export const Route = createFileRoute("/admin/catalogo/produtos/novo")({
  head: () => ({ meta: [{ title: "Novo produto — Hr Shoes" }] }),
  loader: async () => {
    const res = await listProductTypes();
    return res.status === "ok" ? res.data : [];
  },
  component: NewProductPage,
});

function NewProductPage() {
  const types = Route.useLoaderData();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | "generic">("generic");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const selectedType = types.find(
    (t: { id: string; name: string; field_schema: unknown[] }) => t.id === selectedTypeId,
  );
  const dynamicFields = (selectedType?.field_schema || []) as {
    name: string;
    kind: string;
    required: boolean;
  }[];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      slug: "",
      price_cents: "",
      status: "draft",
      attributes: {} as Record<string, unknown>,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: {
    title: string;
    slug: string;
    price_cents: string;
    status: string;
    attributes: Record<string, unknown>;
  }) => {
    setIsSubmitting(true);
    try {
      const supabase = getBrowserClient();
      const media_urls: string[] = [];

      // Upload files first
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${values.slug}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from("product-media")
          .upload(fileName, file, { upsert: false });

        if (error) {
          toast.error("Erro no upload: " + error.message);
          setIsSubmitting(false);
          return;
        }
        
        const { data: publicData } = supabase.storage.from("product-media").getPublicUrl(data.path);
        media_urls.push(publicData.publicUrl);
      }

      const priceCents = parseInt(values.price_cents.replace(/\D/g, ""), 10) || 0;

      const res = await createProduct({
        data: {
          title: values.title,
          slug: values.slug,
          price_cents: priceCents,
          status: values.status as "draft" | "published" | "archived",
          type_id: selectedTypeId === "generic" ? null : selectedTypeId,
          attributes: values.attributes,
          media_urls,
        },
      });

      if (res.status === "success") {
        toast.success("Produto criado com sucesso!");
        navigate({ to: "/admin/catalogo/produtos" });
      } else {
        toast.error(res.message || "Erro ao criar produto");
      }
    } catch (e: unknown) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDynamicField = (field: { name: string; kind: string; required: boolean }) => {
    const errorMsg = (errors.attributes as Record<string, { message?: string }>)?.[field.name]
      ?.message;

    return (
      <div key={field.name} className="space-y-2">
        <Label>
          {field.name} {field.required && <span className="text-destructive">*</span>}
        </Label>

        {field.kind === "text" && (
          <Input {...register(`attributes.${field.name}` as const, { required: field.required })} />
        )}

        {field.kind === "number" && (
          <Input
            type="number"
            {...register(`attributes.${field.name}` as const, { required: field.required })}
          />
        )}

        {field.kind === "boolean" && (
          <Select
            onValueChange={(v) =>
              setValue("attributes", { ...watch("attributes"), [field.name]: v === "true" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sim</SelectItem>
              <SelectItem value="false">Não</SelectItem>
            </SelectContent>
          </Select>
        )}

        {field.kind === "select_single" && (
          <Input
            placeholder="Valor da opção..."
            {...register(`attributes.${field.name}` as const, { required: field.required })}
          />
        )}

        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        eyebrow="Catálogo"
        title="Novo produto"
        description="Preencha os dados básicos e os campos dinâmicos baseados no tipo selecionado."
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/admin/catalogo/produtos" })}>
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Básicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Produto</Label>
                <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Genérico (sem tipo)</SelectItem>
                    {types.map((t: { id: string; name: string }) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select defaultValue="draft" onValueChange={(v) => setValue("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome do produto</Label>
              <Input
                {...register("title", { required: "Obrigatório" })}
                onChange={(e) => {
                  register("title").onChange(e);
                  const slug = e.target.value
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");
                  setValue("slug", slug);
                }}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input {...register("slug", { required: "Obrigatório" })} />
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
                  {...register("price_cents", { required: "Obrigatório" })}
                  placeholder="0,00"
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v) {
                      v = (parseInt(v, 10) / 100).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      });
                    }
                    e.target.value = v;
                    register("price_cents").onChange(e);
                  }}
                />
                {errors.price_cents && (
                  <p className="text-xs text-destructive">{errors.price_cents.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mídia (Imagens)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previewUrls.map((url, i) => (
                <div key={i} className="relative aspect-square border rounded-md overflow-hidden bg-muted group">
                  <img src={url} alt={`Preview ${i}`} className="object-cover w-full h-full" />
                  <button 
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Label className="flex flex-col items-center justify-center border-2 border-dashed rounded-md aspect-square cursor-pointer hover:bg-muted/50 transition-colors">
                <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-muted-foreground">Adicionar Fotos</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </Label>
            </div>
          </CardContent>
        </Card>

        {dynamicFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campos Dinâmicos ({selectedType?.name})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">{dynamicFields.map(renderDynamicField)}</div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: "/admin/catalogo/produtos" })}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}

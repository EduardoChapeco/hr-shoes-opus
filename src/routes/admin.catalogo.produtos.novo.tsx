import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Plus, X, Upload } from "lucide-react";

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
    const [catsRes, typesRes] = await Promise.all([
      listCategories(),
      import("@/services/admin-catalog.functions").then((m) => m.listProductTypes()),
    ]);
    return {
      categories: catsRes || [],
      productTypes: typesRes || [],
    };
  },
  component: QuickNewProductPage,
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type DynamicAttribute = {
  id: string;
  name: string;
  values: string[];
};

type VariantRow = {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  stock: number;
  price_cents: number;
  image_url: string | null;
};

// Gera o produto cartesiano das opções
function generateVariantsMatrix(
  attributes: DynamicAttribute[],
  baseSku: string,
  basePrice: number,
  baseStock: number,
): VariantRow[] {
  const activeAttrs = attributes.filter((a) => a.name.trim() && a.values.length > 0);
  if (activeAttrs.length === 0) return [];

  const optionArrays = activeAttrs.map((a) => a.values.map((v) => ({ name: a.name, value: v })));

  const cartesian = optionArrays.reduce((a, b) => a.flatMap((d) => b.map((e) => [...d, e])), [
    [],
  ] as { name: string; value: string }[][]);

  return cartesian.map((combo, idx) => {
    const attrsObj: Record<string, string> = {};
    const skuParts: string[] = [baseSku];

    for (const item of combo) {
      attrsObj[item.name] = item.value;
      const cleanVal = item.value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .slice(0, 4);
      skuParts.push(cleanVal);
    }

    return {
      id: crypto.randomUUID(),
      sku: skuParts.join("-") || `${baseSku}-var-${idx + 1}`,
      attributes: attrsObj,
      stock: baseStock,
      price_cents: basePrice,
      image_url: null,
    };
  });
}

function QuickNewProductPage() {
  const { categories, productTypes } = Route.useLoaderData();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Imagem principal
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);

  // Atributos dinâmicos
  const [attributes, setAttributes] = useState<DynamicAttribute[]>([]);

  // Tabela final de variações (substitui a seleção estática)
  const [variantsMatrix, setVariantsMatrix] = useState<VariantRow[]>([]);
  const [isMatrixGenerated, setIsMatrixGenerated] = useState(false);

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
      category_id: "none",
      type_id: "none",
    },
  });

  const basePriceCents = parseInt(watch("price_cents").replace(/\D/g, ""), 10) || 0;
  const targetSlug = watch("slug") || slugify(watch("title"));

  // --- Manipulação de Atributos ---
  const addAttribute = () => {
    setAttributes([...attributes, { id: crypto.randomUUID(), name: "", values: [] }]);
  };

  const removeAttribute = (id: string) => {
    setAttributes(attributes.filter((a) => a.id !== id));
  };

  const updateAttributeName = (id: string, name: string) => {
    setAttributes(attributes.map((a) => (a.id === id ? { ...a, name } : a)));
  };

  const addAttributeValue = (id: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val) {
        setAttributes(
          attributes.map((a) =>
            a.id === id && !a.values.includes(val) ? { ...a, values: [...a.values, val] } : a,
          ),
        );
        e.currentTarget.value = "";
      }
    }
  };

  const removeAttributeValue = (attrId: string, valueToRemove: string) => {
    setAttributes(
      attributes.map((a) =>
        a.id === attrId ? { ...a, values: a.values.filter((v) => v !== valueToRemove) } : a,
      ),
    );
  };

  // --- Geração da Matriz ---
  const handleGenerateMatrix = () => {
    if (attributes.length === 0 || attributes.every((a) => a.values.length === 0)) {
      toast.error("Adicione pelo menos um atributo com valores para gerar variações.");
      return;
    }
    const matrix = generateVariantsMatrix(attributes, targetSlug || "PROD", basePriceCents, 10);
    if (matrix.length > 150) {
      toast.error(
        `Esta combinação gerará ${matrix.length} variações. Recomendamos criar no máximo 150 de uma vez para não travar o navegador.`,
      );
      return;
    }
    setVariantsMatrix(matrix);
    setIsMatrixGenerated(true);
    toast.success(`${matrix.length} variações geradas com sucesso!`);
  };

  // --- Atualização de Variação Individual ---
  const updateVariant = (id: string, field: keyof VariantRow, value: any) => {
    setVariantsMatrix((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const priceCents = parseInt(values.price_cents.replace(/\D/g, ""), 10) || 0;
      const finalSlug = values.slug || slugify(values.title);

      const res = await createProduct({
        data: {
          title: values.title,
          slug: finalSlug,
          price_cents: priceCents,
          status: values.status as "draft" | "published" | "archived",
          category_ids: values.category_id !== "none" ? [values.category_id] : [],
          type_id: values.type_id !== "none" ? values.type_id : null,
          media_urls: mainImageUrl ? [mainImageUrl] : [],
          is_physical: true,
          attributes: {},
          variants: isMatrixGenerated && variantsMatrix.length > 0 ? variantsMatrix : undefined,
        },
      });

      if (res) {
        toast.success(`Produto salvo com ${variantsMatrix.length || 1} variação(ões)!`);
        navigate({ to: "/admin/catalogo/produtos/$id", params: { id: res.id } });
      } else {
        toast.error("Erro ao criar produto");
        setIsSubmitting(false);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro inesperado ao salvar produto");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        eyebrow="Catálogo / Produtos"
        title="Novo Produto"
        description="Cadastre seu produto de forma flexível. Crie opções dinâmicas como Tamanho, Cor, Material, etc."
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/catalogo/produtos" })}>
              <ArrowLeft className="mr-2 size-4" /> Cancelar
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="min-w-32">
              {isSubmitting ? (
                "Criando..."
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-2" /> Salvar & Continuar
                </>
              )}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Principais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Principais</CardTitle>
            <CardDescription>O básico para iniciar o cadastro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nome do produto *</Label>
              <Input
                {...register("title", { required: "Obrigatório" })}
                className="h-11 text-base font-medium"
                placeholder="Ex: Tênis Runner Pro Masculino"
                autoFocus
                onChange={(e) => {
                  register("title").onChange(e);
                  setValue("slug", slugify(e.target.value));
                }}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message as string}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Preço Base (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    R$
                  </span>
                  <Input
                    {...register("price_cents", { required: "Obrigatório" })}
                    className="pl-9 h-11 text-lg font-medium"
                    placeholder="0,00"
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val) {
                        val = (parseInt(val, 10) / 100).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                      }
                      e.target.value = val;
                      register("price_cents").onChange(e);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">URL Automática (Slug)</Label>
                <Input {...register("slug")} className="h-11 bg-muted/50" readOnly />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Categoria Principal</Label>
                <Select onValueChange={(val) => setValue("category_id", val)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tipo / Template de Ficha</Label>
                <Select onValueChange={(val) => setValue("type_id", val)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Geral (Padrão)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geral (Padrão)</SelectItem>
                    {productTypes.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mídia Principal */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Capa Inicial (Opcional)</CardTitle>
            <CardDescription>
              A imagem principal deste produto. Você poderá adicionar mais depois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm">
              <ImageUpload onChange={setMainImageUrl} value={mainImageUrl} bucket="product-media" />
            </div>
          </CardContent>
        </Card>

        {/* Gerador de Variações Dinâmicas */}
        <Card className="border-pink-500/30 overflow-hidden">
          <div className="bg-pink-500/5 px-6 py-4 border-b border-pink-500/10">
            <h3 className="text-lg font-bold text-pink-700 dark:text-pink-400">
              Construtor Dinâmico de Variações
            </h3>
            <p className="text-sm text-pink-600/80 dark:text-pink-400/80 mt-1">
              Crie opções customizadas (Tamanho, Cor, Material) para gerar automaticamente a matriz
              de estoque.
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {!isMatrixGenerated ? (
              <div className="space-y-6 animate-in fade-in">
                {attributes.map((attr, index) => (
                  <div key={attr.id} className="p-4 border rounded-xl bg-card relative group">
                    <button
                      type="button"
                      onClick={() => removeAttribute(attr.id)}
                      className="absolute right-4 top-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1 space-y-2">
                        <Label>Nome da Opção</Label>
                        <Input
                          placeholder="Ex: Tamanho"
                          value={attr.name}
                          onChange={(e) => updateAttributeName(attr.id, e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-3 space-y-2">
                        <Label>Valores (Pressione Enter para adicionar)</Label>
                        <Input
                          placeholder="Ex: P, M, G, Vermelho, Azul..."
                          onKeyDown={(e) => addAttributeValue(attr.id, e)}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {attr.values.map((val) => (
                            <span
                              key={val}
                              className="px-3 py-1 bg-secondary rounded-full text-sm font-medium flex items-center gap-1 border"
                            >
                              {val}
                              <button
                                type="button"
                                onClick={() => removeAttributeValue(attr.id, val)}
                                className="hover:text-destructive p-0.5 rounded-full hover:bg-black/5 ml-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addAttribute}
                    className="border-dashed border-2"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Opção (Atributo)
                  </Button>
                  {attributes.length > 0 && (
                    <Button
                      type="button"
                      onClick={handleGenerateMatrix}
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      Gerar Matriz de Variações
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
                  <div>
                    <h4 className="font-bold text-base">Matriz de Variações Gerada</h4>
                    <p className="text-sm text-muted-foreground">
                      {variantsMatrix.length} variações prontas para revisão.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMatrixGenerated(false)}
                  >
                    Editar Atributos Base
                  </Button>
                </div>

                <div className="border rounded-xl overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Imagem</th>
                        <th className="px-4 py-3">Variação</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Estoque</th>
                        <th className="px-4 py-3">Preço (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {variantsMatrix.map((variant) => (
                        <tr key={variant.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 w-20">
                            {variant.image_url ? (
                              <div className="relative group w-12 h-12 rounded-md overflow-hidden border">
                                <img
                                  src={variant.image_url}
                                  alt="Variante"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateVariant(variant.id, "image_url", null)}
                                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-12 h-12">
                                <ImageUpload
                                  onChange={(url: string) =>
                                    updateVariant(variant.id, "image_url", url)
                                  }
                                  bucket="product-media"
                                  className="h-full w-full p-0 min-h-[48px] rounded-md"
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {Object.values(variant.attributes).join(" / ")}
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={variant.sku}
                              onChange={(e) => updateVariant(variant.id, "sku", e.target.value)}
                              className="h-8 max-w-[150px]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={variant.stock}
                              onChange={(e) =>
                                updateVariant(variant.id, "stock", parseInt(e.target.value) || 0)
                              }
                              className="h-8 w-20"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative max-w-[120px]">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                R$
                              </span>
                              <Input
                                value={(variant.price_cents / 100).toFixed(2).replace(".", ",")}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  updateVariant(variant.id, "price_cents", parseInt(val) || 0);
                                }}
                                className="h-8 pl-7"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

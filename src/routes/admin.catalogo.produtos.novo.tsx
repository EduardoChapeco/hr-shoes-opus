import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, X, Box, Tag, Layers, Settings2, CheckCircle2, DollarSign, Plus } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  listProductTypes,
  createProduct,
  uploadProductMedia,
  listCategories,
} from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/produtos/novo")({
  head: () => ({ meta: [{ title: "Novo produto — Hr Shoes" }] }),
  loader: async () => {
    const [typesRes, catsRes] = await Promise.all([listProductTypes(), listCategories()]);
    return {
      types: typesRes.status === "ok" ? typesRes.data : [],
      categories: catsRes.status === "ok" ? catsRes.data : [],
    };
  },
  component: NewProductPage,
});

// Helper for cartesian product
function cartesianProduct(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [];
  return arrays.reduce((acc, curr) => {
    if (curr.length === 0) return acc;
    if (acc.length === 0) return curr.map(c => [c]);
    return acc.flatMap(a => curr.map(c => [...a, c]));
  }, [] as string[][]);
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function NewProductPage() {
  const { types, categories } = Route.useLoaderData();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | "generic">("generic");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Variações Dinâmicas
  const [variants, setVariants] = useState<{ sku: string; attributes: Record<string, string>; stock: number }[]>([
    { sku: "", attributes: {}, stock: 0 }
  ]);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string[]>>({});

  const [activeTab, setActiveTab] = useState("general");

  const selectedType = types.find((t: any) => t.id === selectedTypeId);
  
  const dynamicFields = (selectedType?.field_schema || []) as {
    name: string;
    kind: string;
    required: boolean;
    options?: string[];
  }[];

  const staticFields = dynamicFields.filter(f => f.kind !== "option_group");
  const variantGroups = dynamicFields.filter(f => f.kind === "option_group");

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
      short_description: "",
      manufacturer: "",
      ean: "",
      meta_title: "",
      meta_description: "",
      description: "",
      price_cents: "",
      compare_at_cents: "",
      status: "draft",
      is_physical: true,
      weight_kg: "",
      width_cm: "",
      height_cm: "",
      length_cm: "",
      preparation_time_days: "",
      attributes: {} as Record<string, unknown>,
    },
  });

  const baseSlug = watch("slug");

  // Re-calculate Cartesian Product when Variant Options change
  useEffect(() => {
    if (variantGroups.length === 0) return;

    const groupNames = variantGroups.map(g => g.name);
    const arraysToMultiply = groupNames.map(name => selectedVariantOptions[name] || []);
    
    // Check if at least one group has selections
    const hasAnySelection = arraysToMultiply.some(arr => arr.length > 0);
    
    if (!hasAnySelection) {
      // If nothing selected, reset to a single empty variant
      setVariants([{ sku: "", attributes: {}, stock: 0 }]);
      return;
    }

    // Only multiply groups that have at least one selection
    const activeGroups = groupNames.filter(name => (selectedVariantOptions[name] || []).length > 0);
    const activeArraysToMultiply = activeGroups.map(name => selectedVariantOptions[name] || []);

    const combinations = cartesianProduct(activeArraysToMultiply);

    setVariants(prevVariants => {
      return combinations.map(combo => {
        // combo is an array of strings, e.g. ["38", "Preto"]
        const attributes: Record<string, string> = {};
        activeGroups.forEach((groupName, idx) => {
          attributes[groupName] = combo[idx];
        });

        const comboSignature = JSON.stringify(attributes);
        const existing = prevVariants.find(v => JSON.stringify(v.attributes) === comboSignature);
        
        const generatedSkuSuffix = combo.map(c => slugify(c).toUpperCase()).join("-");
        const defaultSku = baseSlug ? `${baseSlug.toUpperCase()}-${generatedSkuSuffix}` : generatedSkuSuffix;

        if (existing) {
          return { ...existing, sku: existing.sku || defaultSku };
        }
        return {
          sku: defaultSku,
          attributes,
          stock: 0,
        };
      });
    });
  }, [selectedVariantOptions, baseSlug]);

  const toggleVariantOption = (groupName: string, optionValue: string) => {
    setSelectedVariantOptions(prev => {
      const current = prev[groupName] || [];
      const updated = current.includes(optionValue) 
        ? current.filter(v => v !== optionValue)
        : [...current, optionValue];
      return { ...prev, [groupName]: updated };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64 || "");
      };
      reader.onerror = (error) => reject(error);
    });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const media_urls: string[] = [];

      if (files.length > 0) {
        toast.info(`Fazendo upload de ${files.length} mídias...`);
        for (const file of files) {
          const base64 = await toBase64(file);
          const res = await uploadProductMedia({
            data: { fileName: file.name, fileBase64: base64 },
          });
          if (res.status === "error") {
            toast.error("Erro no upload: " + res.message);
            setIsSubmitting(false);
            return;
          }
          media_urls.push(res.url);
        }
      }

      const priceCents = parseInt(values.price_cents.replace(/\D/g, ""), 10) || 0;
      const compareAtCents = values.compare_at_cents ? parseInt(values.compare_at_cents.replace(/\D/g, ""), 10) : undefined;

      const payloadVariants = variants
        .filter((v) => v.sku)
        .map((v) => ({
          sku: v.sku,
          attributes: v.attributes,
          price_cents: priceCents,
          stock: v.stock,
        }));

      const res = await createProduct({
        data: {
          title: values.title,
          slug: values.slug,
          description: values.description,
          price_cents: priceCents,
          compare_at_cents: compareAtCents,
          status: values.status as "draft" | "published" | "archived",
          type_id: selectedTypeId === "generic" ? null : selectedTypeId,
          attributes: values.attributes,
          short_description: values.short_description || null,
          manufacturer: values.manufacturer || null,
          ean: values.ean || null,
          meta_title: values.meta_title || null,
          meta_description: values.meta_description || null,
          is_physical: values.is_physical,
          weight_kg: values.weight_kg ? parseFloat(values.weight_kg) : null,
          width_cm: values.width_cm ? parseFloat(values.width_cm) : null,
          height_cm: values.height_cm ? parseFloat(values.height_cm) : null,
          length_cm: values.length_cm ? parseFloat(values.length_cm) : null,
          preparation_time_days: values.preparation_time_days ? parseInt(values.preparation_time_days, 10) : 0,
          media_urls,
          category_ids: selectedCategory ? [selectedCategory] : [],
          variants: payloadVariants.length > 0 ? payloadVariants : undefined,
        },
      });

      if (res.status === "success") {
        toast.success("Produto criado com sucesso!");
        navigate({ to: "/admin/catalogo/produtos" });
      } else {
        toast.error(res.message || "Erro ao criar produto");
      }
    } catch (e: unknown) {
      toast.error("Erro inesperado ao salvar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px] pb-12">
      <PageHeader
        eyebrow="Catálogo / Produtos"
        title="Cadastrar Novo Produto"
        description="Adicione um novo item ao seu catálogo usando matriz inteligente de variações."
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/catalogo/produtos" })}>
              <ArrowLeft className="mr-2 size-4" /> Cancelar
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="min-w-32">
              {isSubmitting ? "Salvando..." : (
                <>
                  <CheckCircle2 className="size-4 mr-2" /> Salvar Produto
                </>
              )}
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-6">
        <TabsList className="flex flex-col h-auto bg-transparent items-start w-full md:w-56 space-y-2">
          <TabsTrigger value="general" className="w-full justify-start text-left data-[state=active]:bg-primary/5 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 py-2.5">
            <Box className="size-4 mr-2" /> Informações Básicas
          </TabsTrigger>
          <TabsTrigger value="media" className="w-full justify-start text-left data-[state=active]:bg-primary/5 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 py-2.5">
            <ImagePlus className="size-4 mr-2" /> Fotos e Mídias
          </TabsTrigger>
          <TabsTrigger value="pricing" className="w-full justify-start text-left data-[state=active]:bg-primary/5 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 py-2.5">
            <DollarSign className="size-4 mr-2" /> Preço e Variações
          </TabsTrigger>
          <TabsTrigger value="logistics" className="w-full justify-start text-left data-[state=active]:bg-primary/5 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 py-2.5">
            <Layers className="size-4 mr-2" /> Logística
          </TabsTrigger>
          <TabsTrigger value="seo" className="w-full justify-start text-left data-[state=active]:bg-primary/5 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 py-2.5">
            <Tag className="size-4 mr-2" /> SEO e Identidade
          </TabsTrigger>
          <TabsTrigger value="specs" className="w-full justify-start text-left data-[state=active]:bg-primary/5 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 py-2.5">
            <Settings2 className="size-4 mr-2" /> Especificações
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* TAB: GENERAL */}
            <TabsContent value="general" className="space-y-6 mt-0 border-none p-0">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Básicos</CardTitle>
                  <CardDescription>O nome, link e descrição que aparecem para os clientes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Nome do produto *</Label>
                    <Input
                      {...register("title", { required: "Obrigatório" })}
                      className="h-11 text-base font-medium"
                      placeholder="Ex: Tênis Runner Pro Masculino Preto"
                      onChange={(e) => {
                        register("title").onChange(e);
                        const slug = slugify(e.target.value);
                        setValue("slug", slug);
                      }}
                    />
                    {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Descrição do Produto</Label>
                    <Textarea 
                      {...register("description")}
                      placeholder="Descreva as características principais, materiais e benefícios do calçado..."
                      className="min-h-32 resize-y text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-semibold">Categoria Principal</Label>
                        <Link to="/admin/catalogo/categorias" className="text-xs text-primary hover:underline">
                          + Gerenciar
                        </Link>
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sem Categoria</SelectItem>
                          {categories.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Status de Publicação</Label>
                      <Select defaultValue="draft" onValueChange={(v) => setValue("status", v)}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho (Oculto)</SelectItem>
                          <SelectItem value="published">Publicado (Visível)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">URL Slug (Automático)</Label>
                    <div className="flex items-center">
                      <span className="bg-muted px-3 border border-r-0 rounded-l-md h-9 text-xs text-muted-foreground flex items-center">
                        /produto/
                      </span>
                      <Input {...register("slug", { required: "Obrigatório" })} className="h-9 rounded-l-none text-xs bg-muted/30" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: MEDIA */}
            <TabsContent value="media" className="space-y-6 mt-0 border-none p-0">
              <Card>
                <CardHeader>
                  <CardTitle>Galeria de Imagens</CardTitle>
                  <CardDescription>A primeira imagem será a capa do produto. Suporta JPG, PNG e WEBP.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square border-2 border-border rounded-xl overflow-hidden bg-secondary group">
                        <img src={url} alt={`Preview ${i}`} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <X className="size-4" />
                        </button>
                        {i === 0 && (
                          <div className="absolute bottom-0 inset-x-0 bg-primary text-primary-foreground text-[10px] font-bold text-center py-1">
                            CAPA
                          </div>
                        )}
                      </div>
                    ))}
                    <Label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 bg-primary/5 rounded-xl aspect-square cursor-pointer hover:bg-primary/10 transition-colors">
                      <ImagePlus className="size-8 text-primary/60 mb-2" />
                      <span className="text-xs font-bold text-primary">Upload</span>
                      <span className="text-[10px] text-muted-foreground mt-1">Solte imagens aqui</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: PRICING AND VARIANTS */}
            <TabsContent value="pricing" className="space-y-6 mt-0 border-none p-0">
              <Card>
                <CardHeader>
                  <CardTitle>Precificação Base</CardTitle>
                  <CardDescription>Defina o preço de venda para todas as variações.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Preço de Venda (R$) *</Label>
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
                    {errors.price_cents && <p className="text-xs text-destructive">{errors.price_cents.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Preço Comparação ("De")</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-muted-foreground/60 font-medium">R$</span>
                      <Input
                        {...register("compare_at_cents")}
                        className="pl-9 h-11 text-lg font-medium text-muted-foreground bg-muted/30"
                        placeholder="0,00"
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "");
                          if (v) v = (parseInt(v, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                          e.target.value = v;
                          register("compare_at_cents").onChange(e);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Variações e Matriz de Estoque</CardTitle>
                  <CardDescription>Selecione as opções disponíveis para este produto e a tabela será gerada automaticamente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {variantGroups.length > 0 ? (
                    <div className="space-y-6 mb-8 p-4 bg-muted/20 border rounded-xl">
                      {variantGroups.map(group => (
                        <div key={group.name} className="space-y-3">
                          <Label className="text-sm font-semibold text-primary">{group.name}</Label>
                          <div className="flex flex-wrap gap-2">
                            {group.options?.map(opt => {
                              const isSelected = (selectedVariantOptions[group.name] || []).includes(opt);
                              return (
                                <Badge 
                                  key={opt}
                                  variant={isSelected ? "default" : "outline"}
                                  className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1 text-sm"
                                  onClick={() => toggleVariantOption(group.name, opt)}
                                >
                                  {opt}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-500/10 text-yellow-600 rounded-xl text-sm mb-6 border border-yellow-500/20">
                      O Tipo de Produto atual não possui Grupos de Variação definidos. Mude o "Tipo de Produto" na aba Especificações para ativar a matriz cartesiana, ou cadastre uma única variação manual abaixo.
                    </div>
                  )}

                  <div className="border rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[2fr_2fr_1fr_40px] gap-4 bg-muted/50 p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <div>Código SKU</div>
                      <div>Atributos da Variante</div>
                      <div>Estoque</div>
                      <div></div>
                    </div>
                    <div className="divide-y max-h-[500px] overflow-y-auto">
                      {variants.map((variant, idx) => (
                        <div key={idx} className="grid grid-cols-[2fr_2fr_1fr_40px] gap-4 p-3 items-center hover:bg-muted/10 transition-colors">
                          <Input
                            value={variant.sku}
                            className="h-9 text-xs font-mono"
                            onChange={(e) => {
                              const newV = [...variants];
                              newV[idx].sku = e.target.value;
                              setVariants(newV);
                            }}
                            placeholder="Ex: TNS-PRT-40"
                          />
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(variant.attributes).length > 0 ? (
                              Object.entries(variant.attributes).map(([k, v]) => (
                                <Badge key={k} variant="secondary" className="text-[10px]">{v}</Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Variação Única</span>
                            )}
                          </div>
                          <Input
                            type="number"
                            value={variant.stock || ""}
                            className="h-9 text-xs"
                            onChange={(e) => {
                              const newV = [...variants];
                              newV[idx].stock = parseInt(e.target.value, 10) || 0;
                              setVariants(newV);
                            }}
                            placeholder="0"
                          />
                          <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setVariants(variants.filter((_, i) => i !== idx))}>
                            <X className="size-4" />
                          </Button>
                        </div>
                      ))}
                      {variants.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                          Selecione as opções acima para gerar a tabela de SKUs automaticamente.
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-muted/30">
                      <Button type="button" variant="outline" size="sm" onClick={() => setVariants([...variants, { sku: "", attributes: {}, stock: 0 }])}>
                        <Plus className="size-3 mr-2" /> Adicionar Linha Manualmente
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: LOGISTICS */}
            <TabsContent value="logistics" className="space-y-6 mt-0 border-none p-0">
              <Card>
                <CardHeader>
                  <CardTitle>Logística e Dimensões</CardTitle>
                  <CardDescription>Necessário para cálculo automático de frete.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="is_physical" {...register("is_physical")} className="size-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <Label htmlFor="is_physical" className="text-sm font-semibold">Este é um produto físico que requer frete</Label>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Peso (kg)</Label>
                      <Input {...register("weight_kg")} type="number" step="0.001" placeholder="Ex: 0.500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Largura (cm)</Label>
                      <Input {...register("width_cm")} type="number" step="0.01" placeholder="Ex: 20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Altura (cm)</Label>
                      <Input {...register("height_cm")} type="number" step="0.01" placeholder="Ex: 15" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Comprimento (cm)</Label>
                      <Input {...register("length_cm")} type="number" step="0.01" placeholder="Ex: 30" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Prazo de preparação (dias)</Label>
                    <Input {...register("preparation_time_days")} type="number" placeholder="Ex: 0 (Pronta entrega)" />
                    <p className="text-xs text-muted-foreground">Dias adicionados ao prazo de frete padrão.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: SEO & IDENTITY */}
            <TabsContent value="seo" className="space-y-6 mt-0 border-none p-0">
              <Card>
                <CardHeader>
                  <CardTitle>Identidade Canônica</CardTitle>
                  <CardDescription>Informações globais do fornecedor e códigos universais.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Fabricante / Marca Fornecedora</Label>
                    <Input {...register("manufacturer")} placeholder="Ex: Nike S.A." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Código de Barras (EAN / GTIN)</Label>
                    <Input {...register("ean")} placeholder="Ex: 7891234567890" maxLength={14} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO e Metadados</CardTitle>
                  <CardDescription>Otimização para motores de busca e compartilhamento social.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Resumo Curto (Short Description)</Label>
                    <Textarea {...register("short_description")} placeholder="Exiba isso na listagem rápida de produtos..." className="min-h-16" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Meta Title (SEO)</Label>
                    <Input {...register("meta_title")} placeholder="Deixe em branco para usar o título do produto" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Meta Description (SEO)</Label>
                    <Textarea {...register("meta_description")} placeholder="Um resumo atrativo para o Google..." className="min-h-16" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


            {/* TAB: SPECS (Now only static fields) */}
            <TabsContent value="specs" className="space-y-6 mt-0 border-none p-0">
              <Card>
                <CardHeader>
                  <CardTitle>Classificação de Produto</CardTitle>
                  <CardDescription>O tipo define quais grupos de Variações e Campos Dinâmicos serão habilitados.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-w-sm">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">Tipo de Produto</Label>
                      <Link to="/admin/catalogo/tipos" className="text-xs text-primary hover:underline">
                        + Gerenciar Tipos
                      </Link>
                    </div>
                    <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">Genérico (sem tipo definido)</SelectItem>
                        {types.map((t: { id: string; name: string }) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {staticFields.length > 0 && (
                <Card className="border-primary/20 shadow-brand/10">
                  <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                    <CardTitle className="text-primary flex items-center gap-2">
                      <Settings2 className="size-5" /> Especificações Estáticas: {selectedType?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {staticFields.map(field => {
                        const errorMsg = (errors.attributes as Record<string, { message?: string }>)?.[field.name]?.message;
                        return (
                          <div key={field.name} className="space-y-2">
                            <Label className="capitalize">
                              {field.name} {field.required && <span className="text-destructive">*</span>}
                            </Label>
                            {field.kind === "text" && (
                              <Input {...register(`attributes.${field.name}` as const, { required: field.required })} placeholder={`Preencher ${field.name}...`} />
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
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </form>
        </div>
      </Tabs>
    </div>
  );
}

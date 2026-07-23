import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect, Fragment } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  ImagePlus,
  X,
  Loader2,
  Trash2,
  Eye,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Percent,
  TrendingUp,
  Package,
  CheckCircle2,
  Settings,
  LayoutList,
  Box,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { ProductEditorLayout } from "@/components/admin/product-editor/product-editor-layout";
import { VariantFormRow } from "@/components/admin/product-editor/variant-form-row";
import { VariantOptionsBuilder } from "@/components/admin/product-editor/variant-options-builder";
import { VariantListGrid } from "@/components/admin/product-editor/variant-list-grid";

import { PageHeader } from "@/components/commerce/page-header";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";
import { Crop } from "lucide-react";
import { PriceDisplay } from "@/components/commerce/price-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

import {
  getProductById,
  updateProduct,
  upsertProductVariant,
  deleteProductMedia,
  addProductMediaLink,
  updateProductMediaMetadata,
  reorderProductMedia,
  listCategories,
  createCategory,
} from "@/services/admin-catalog.functions";
import { formatMoney } from "@/lib/money";
import { adjustStock } from "@/services/stock.functions";
import { GridBuilderDialog } from "@/components/admin/grid-builder-dialog";

export const Route = createFileRoute("/admin/catalogo/produtos/$id")({
  head: () => ({ meta: [{ title: "Editor Avançado de Produto — Hr Shoes" }] }),
  loader: async ({ params }) => {
    const [product, catsRes, typesRes] = await Promise.all([
      getProductById({ data: { id: params.id } }),
      listCategories(),
      import("@/services/admin-catalog.functions").then(m => m.listProductTypes())
    ]);
    if (!product) throw new Error("Produto não encontrado.");
    return {
      product,
      categories: catsRes || [],
      productTypes: typesRes || [],
    };
  },
  component: EditProductPage,
});

function EditProductPage() {
  const { product, categories, productTypes } = Route.useLoaderData();

  // State for live preview updates
  const [liveTitle, setLiveTitle] = useState(product.title);
  const [liveDescription, setLiveDescription] = useState(product.description || "");
  const [liveBrand, setLiveBrand] = useState(product.brand || "");
  const [livePriceCents, setLivePriceCents] = useState(product.price_cents || 0);
  const [liveCompareCents, setLiveCompareCents] = useState(product.compare_at_cents || null);
  const [liveCostCents, setLiveCostCents] = useState(product.cost_cents || null);
  const [liveStatus, setLiveStatus] = useState(product.status || "draft");

  // Collect unique attribute keys from actual variants
  const attributeKeys: string[] = useMemo(() => {
    return Array.from(
      new Set((product.product_variants || []).flatMap((v: any) => Object.keys(v.attributes || {}))),
    );
  }, [product.product_variants]);

  // Main Cover Image for preview
  const coverImage = product.product_media?.[0]?.url;

  // Profit margin calculation
  const profitMarginPercent = useMemo(() => {
    if (!livePriceCents || !liveCostCents || livePriceCents <= 0) return null;
    const profit = livePriceCents - liveCostCents;
    return Math.round((profit / livePriceCents) * 100);
  }, [livePriceCents, liveCostCents]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo / Editor Avançado"
        title={liveTitle || "Editar Produto"}
        description="Workspace duplo com preview em tempo real no lado esquerdo e formulário comercial no lado direito."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild size="sm">
              <Link to="/admin/catalogo/produtos">
                <ArrowLeft className="mr-1.5 size-4" />
                Voltar ao Catálogo
              </Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link to={`/produto/${product.slug}` as never} target="_blank">
                <Eye className="mr-1.5 size-4" />
                Ver na Vitrine
              </Link>
            </Button>
          </div>
        }
      />

      <ProductEditorLayout
        preview={
          <div className="space-y-4">
            <Card className="border-primary/20 bg-gradient-to-b from-card to-muted/20 shadow-md overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/40 flex flex-row items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  Preview
                </span>
                <Badge variant={liveStatus === "published" ? "default" : "secondary"} className="text-[10px]">
                  {liveStatus === "published" ? "Publicado" : liveStatus === "archived" ? "Arquivado" : "Rascunho"}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="relative aspect-square rounded-xl bg-muted/60 overflow-hidden border border-border flex items-center justify-center">
                  {coverImage ? (
                    <img src={coverImage} alt={liveTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="size-10 stroke-1" />
                      <span className="text-xs">Sem foto de capa</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  {liveBrand && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {liveBrand}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-foreground line-clamp-2">
                    {liveTitle || "Título do produto..."}
                  </h3>
                  <div className="pt-1">
                    <PriceDisplay amountCents={livePriceCents} compareAtCents={liveCompareCents ?? undefined} size="lg" />
                  </div>
                  {profitMarginPercent !== null && (
                    <div className="pt-2">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1">
                        <TrendingUp className="size-3.5" /> Margem Estimada: {profitMarginPercent}%
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        }
        sections={[
          { id: "geral", label: "Informações Básicas", icon: <Box /> },
          { id: "midias", label: "Galeria de Fotos", icon: <ImagePlus /> },
          { id: "variantes", label: "Estoque & Variações", icon: <LayoutList /> },
        ]}
      >
        <div id="geral" className="scroll-mt-32">
          <GeneralForm
            product={product}
            categories={categories}
            productTypes={productTypes}
            onTitleChange={setLiveTitle}
            onDescriptionChange={setLiveDescription}
            onBrandChange={setLiveBrand}
            onPriceChange={setLivePriceCents}
            onCompareChange={setLiveCompareCents}
            onCostChange={setLiveCostCents}
            onStatusChange={setLiveStatus}
          />
        </div>

        <div id="midias" className="scroll-mt-32 pt-12 border-t">
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><ImagePlus className="size-5 text-primary" /> Galeria de Fotos</h2>
            <p className="text-sm text-muted-foreground">Arraste para reordenar, gerencie fotos e vídeos e defina o focal point.</p>
          </div>
          <MediaManager product={product} />
        </div>

        <div id="variantes" className="scroll-mt-32 pt-12 border-t">
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><LayoutList className="size-5 text-primary" /> Estoque & Variações</h2>
            <p className="text-sm text-muted-foreground">Gerencie o saldo em estoque, variações de tamanho, cor, SKUs e EANs específicos.</p>
          </div>
          <VariantsManager product={product} />
        </div>
      </ProductEditorLayout>
    </div>
  );
}

function GeneralForm({
  product,
  categories,
  productTypes,
  onTitleChange,
  onDescriptionChange,
  onBrandChange,
  onPriceChange,
  onCompareChange,
  onCostChange,
  onStatusChange,
}: {
  product: any;
  categories: any[];
  productTypes: any[];
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onPriceChange: (v: number) => void;
  onCompareChange: (v: number | null) => void;
  onCostChange: (v: number | null) => void;
  onStatusChange: (v: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialCategoryId = product.product_categories?.[0]?.category_id || "";
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryId);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: product.title,
      description: product.description || "",
      brand: product.brand || "",
      price_cents: (product.price_cents / 100).toFixed(2),
      compare_at_cents: product.compare_at_cents ? (product.compare_at_cents / 100).toFixed(2) : "",
      cost_cents: product.cost_cents ? (product.cost_cents / 100).toFixed(2) : "",
      status: product.status,
      short_description: product.short_description || "",
      manufacturer: product.manufacturer || "",
      ean: product.ean || "",
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
      is_physical: product.is_physical !== false,
      weight_kg: product.weight_kg || "",
      width_cm: product.width_cm || "",
      height_cm: product.height_cm || "",
      length_cm: product.length_cm || "",
      preparation_time_days: product.preparation_time_days || 0,
      type_id: product.type_id || "none",
      attributes: product.attributes || {},
    },
  });

  const watchTitle = watch("title");
  const watchDescription = watch("description");
  const watchBrand = watch("brand");
  const watchPrice = watch("price_cents");
  const watchCompare = watch("compare_at_cents");
  const watchCost = watch("cost_cents");
  const watchStatus = watch("status");
  const watchTypeId = watch("type_id");
  const selectedProductType = useMemo(() => {
    return productTypes.find((t) => t.id === watchTypeId);
  }, [watchTypeId, productTypes]);

  // Re-emit live updates to preview
  useEffect(() => {
    onTitleChange(watchTitle);
  }, [watchTitle, onTitleChange]);

  useEffect(() => {
    onDescriptionChange(watchDescription);
  }, [watchDescription, onDescriptionChange]);

  useEffect(() => {
    onBrandChange(watchBrand);
  }, [watchBrand, onBrandChange]);

  useEffect(() => {
    const p = parseFloat((watchPrice || "0").replace(",", "."));
    onPriceChange(isNaN(p) ? 0 : Math.round(p * 100));
  }, [watchPrice, onPriceChange]);

  useEffect(() => {
    if (!watchCompare) return onCompareChange(null);
    const c = parseFloat(watchCompare.replace(",", "."));
    onCompareChange(isNaN(c) ? null : Math.round(c * 100));
  }, [watchCompare, onCompareChange]);

  useEffect(() => {
    if (!watchCost) return onCostChange(null);
    const cost = parseFloat(watchCost.replace(",", "."));
    onCostChange(isNaN(cost) ? null : Math.round(cost * 100));
  }, [watchCost, onCostChange]);

  useEffect(() => {
    onStatusChange(watchStatus);
  }, [watchStatus, onStatusChange]);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const price_cents = Math.round(parseFloat(values.price_cents.replace(",", ".")) * 100);
      const compare_at_cents = values.compare_at_cents
        ? Math.round(parseFloat(values.compare_at_cents.replace(",", ".")) * 100)
        : null;
      const cost_cents = values.cost_cents
        ? Math.round(parseFloat(values.cost_cents.replace(",", ".")) * 100)
        : null;
      const res = await updateProduct({
        data: {
          id: product.id,
          title: values.title,
          description: values.description,
          brand: values.brand,
          status: values.status,
          price_cents,
          compare_at_cents,
          cost_cents,
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
          category_ids: selectedCategory ? [selectedCategory] : [],
          type_id: values.type_id !== "none" ? values.type_id : null,
          attributes: values.attributes,
        },
      });

      if (res) {
        toast.success("Produto atualizado com sucesso!");
      } else {
        toast.error(res.message || "Erro ao atualizar");
      }
    } catch (e) {
      toast.error("Erro inesperado ao salvar alterações");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    try {
      const slug = newCategoryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const res = await createCategory({
        data: {
          name: newCategoryName,
          slug,
          status: "active"
        }
      });
      if (res) {
        toast.success("Categoria criada!");
        categories.push(res);
        setSelectedCategory(res.id);
        setIsCategoryModalOpen(false);
        setNewCategoryName("");
      } else {
        toast.error("Erro ao criar categoria");
      }
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Comerciais Principais</CardTitle>
          <CardDescription>Defina o título, marca e descrição detalhada do produto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título do Produto *</Label>
            <Input {...register("title", { required: "Obrigatório" })} />
            {errors.title && <span className="text-xs text-destructive">Título obrigatório</span>}
          </div>
          <div className="space-y-2">
            <Label>Descrição Completa (Rich Text / Texto)</Label>
            <Textarea {...register("description")} rows={5} placeholder="Descreva os materiais, conforto, altura do salto e indicações de uso..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marca / Fabricante</Label>
              <Input {...register("brand")} placeholder="Ex: Hr Shoes, Vizzano, Beira Rio..." />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Categoria Principal</Label>
                <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-xs text-primary hover:underline font-medium">
                      + Nova Categoria
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome da Categoria</Label>
                        <Input 
                          value={newCategoryName} 
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Ex: Lançamentos"
                          autoFocus
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</Button>
                      <Button type="button" onClick={handleCreateCategory} disabled={isCreatingCategory || !newCategoryName.trim()}>
                        {isCreatingCategory ? "Criando..." : "Criar Categoria"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Categoria</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Precificação & Lucratividade</CardTitle>
          <CardDescription>Valores em Reais (R$). Cálculos de margem de lucro acontecem em tempo real.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Preço de Venda (R$) *</Label>
            <Input step="0.01" type="number" {...register("price_cents", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>Preço Comparativo De (R$)</Label>
            <Input step="0.01" type="number" placeholder="Ex: 299.90" {...register("compare_at_cents")} />
          </div>
          <div className="space-y-2">
            <Label>Custo por Item (R$)</Label>
            <Input step="0.01" type="number" placeholder="Ex: 80.00" {...register("cost_cents")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publicação & Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status de Visibilidade</Label>
            <Select defaultValue={product.status} onValueChange={(val) => setValue("status", val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho (Oculto)</SelectItem>
                <SelectItem value="published">Publicado (Visível na Vitrine)</SelectItem>
                <SelectItem value="archived">Arquivado (Inativo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutList className="size-4" /> 
            Ficha Técnica Dinâmica (Tipo de Produto)
          </CardTitle>
          <CardDescription>
            Defina um tipo de produto para renderizar campos específicos (ex: Material, Voltagem, Indicação) de acordo com o seu nicho.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Tipo de Produto</Label>
            <Select value={watchTypeId} onValueChange={(val) => setValue("type_id", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Produto Genérico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Produto Genérico</SelectItem>
                {productTypes.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProductType && selectedProductType.field_schema && selectedProductType.field_schema.length > 0 && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Campos de {selectedProductType.name}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedProductType.field_schema.map((field: any, idx: number) => {
                  const fieldKey = `attributes.${field.name}`;
                  return (
                    <div key={idx} className="space-y-2">
                      <Label className="flex items-center gap-1">
                        {field.name}
                        {field.required && <span className="text-destructive">*</span>}
                      </Label>
                      
                      {field.kind === "text" && (
                        <Input {...register(fieldKey as any, { required: field.required })} placeholder="Ex: Algodão" />
                      )}
                      
                      {field.kind === "number" && (
                        <Input type="number" step="any" {...register(fieldKey as any, { required: field.required })} placeholder="0" />
                      )}

                      {field.kind === "boolean" && (
                        <div className="flex items-center h-10 space-x-2">
                          <Checkbox
                            id={fieldKey}
                            checked={watch(fieldKey as any) === true}
                            onCheckedChange={(checked: boolean) => setValue(fieldKey as any, checked === true)}
                          />
                          <label htmlFor={fieldKey} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Sim, possui {field.name.toLowerCase()}
                          </label>
                        </div>
                      )}

                      {(field.kind === "select_single" || field.kind === "option_group") && (
                        <Select 
                          value={watch(fieldKey as any) || ""} 
                          onValueChange={(val) => setValue(fieldKey as any, val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((opt: string, i: number) => (
                              <SelectItem key={i} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logística Avançada & Dimensões</CardTitle>
          <CardDescription>Necessário para cálculo de frete e prazos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="is_physical" {...register("is_physical")} className="size-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <Label htmlFor="is_physical" className="text-sm font-semibold">Este é um produto físico que requer frete</Label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input {...register("weight_kg")} type="number" step="0.001" placeholder="Ex: 0.500" />
            </div>
            <div className="space-y-2">
              <Label>Largura (cm)</Label>
              <Input {...register("width_cm")} type="number" step="0.01" placeholder="Ex: 20" />
            </div>
            <div className="space-y-2">
              <Label>Altura (cm)</Label>
              <Input {...register("height_cm")} type="number" step="0.01" placeholder="Ex: 15" />
            </div>
            <div className="space-y-2">
              <Label>Comprimento (cm)</Label>
              <Input {...register("length_cm")} type="number" step="0.01" placeholder="Ex: 30" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prazo de Preparação (dias)</Label>
              <Input {...register("preparation_time_days")} type="number" placeholder="Ex: 0" />
            </div>
            <div className="space-y-2">
              <Label>Origem de Envio</Label>
              <Select
                defaultValue={(product.attributes as any)?.origin || "national"}
                onValueChange={async (val) => {
                  const currentAttr = (product.attributes as any) || {};
                  const newAttr = { ...currentAttr, origin: val };
                  await updateProduct({ data: { id: product.id, attributes: newAttr } });
                  toast.success("Origem atualizada com sucesso!");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">Nacional (Brasil)</SelectItem>
                  <SelectItem value="international">Internacional (Importação)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificadores & SEO</CardTitle>
          <CardDescription>Otimização para busca e conformidade fiscal/EAN.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fabricante / Marca do Fornecedor</Label>
              <Input {...register("manufacturer")} placeholder="Ex: Nike S.A." />
            </div>
            <div className="space-y-2">
              <Label>Código EAN / GTIN</Label>
              <Input {...register("ean")} placeholder="Ex: 7891234567890" maxLength={14} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Resumo Curto (Short Description)</Label>
            <Textarea {...register("short_description")} placeholder="Visualização rápida do produto..." className="min-h-16" />
          </div>
          <div className="space-y-2">
            <Label>Meta Title (SEO)</Label>
            <Input {...register("meta_title")} />
          </div>
          <div className="space-y-2">
            <Label>Meta Description (SEO)</Label>
            <Textarea {...register("meta_description")} className="min-h-16" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} size="lg" className="font-bold">
          {isSubmitting ? "Salvando..." : "Salvar Alterações do Produto"}
        </Button>
      </div>
    </form>
  );
}

function VariantsManager({ product }: { product: any }) {
  const router = useRouter();
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rapido" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
          <TabsTrigger value="rapido" className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4" /> Modo Rápido (Opções)
          </TabsTrigger>
          <TabsTrigger value="avancado" className="flex items-center gap-2 font-semibold">
            <Settings className="size-4" /> Modo Avançado (Tabela)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="rapido" className="mt-0">
          <VariantOptionsBuilder product={product} />
        </TabsContent>

        <TabsContent value="avancado" className="mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Tabela de Variantes</CardTitle>
                <CardDescription>Gerencie SKUs, imagens específicas, estoque e preços por variante.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => { setIsAddingNew(true); setEditingVariantId(null); }}>
                  <Plus className="mr-1.5 size-4" /> Nova Variante Manual
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <VariantListGrid product={product} onEditVariant={setEditingVariantId} />
            </CardContent>
          </Card>

          {editingVariantId && (
             <VariantFormRow
               productId={product.id}
               variant={product.product_variants?.find((v: any) => v.id === editingVariantId)}
               onClose={() => setEditingVariantId(null)}
             />
          )}

          {isAddingNew && (
             <VariantFormRow
               productId={product.id}
               onClose={() => setIsAddingNew(false)}
             />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MediaManager({ product }: { product: any }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [editingMedia, setEditingMedia] = useState<any | null>(null);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  const handleAddImage = async (url: string) => {
    if (!url) return;
    setIsAdding(true);
    try {
      const res = await addProductMediaLink({ data: { product_id: product.id, url } });
      if (res) {
        toast.success("Imagem vinculada e salva na galeria!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar imagem.");
      }
    } catch {
      toast.error("Erro inesperado ao salvar imagem.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (mediaId: string, mediaUrl: string) => {
    try {
      await deleteProductMedia({ data: { id: mediaId, url: mediaUrl } });
      toast.success("Mídia removida.");
      router.invalidate();
    } catch (e) {
      toast.error("Erro ao deletar mídia");
    }
  };

  const handleMove = async (index: number, direction: "left" | "right") => {
    const list = [...(product.product_media || [])];
    if (direction === "left" && index === 0) return;
    if (direction === "right" && index === list.length - 1) return;

    const targetIdx = direction === "left" ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const mediaOrders = list.map((item, idx) => ({
      id: item.id,
      sort_order: idx,
    }));

    try {
      await reorderProductMedia({ data: { mediaOrders } });
      toast.success("Ordenação atualizada!");
      router.invalidate();
    } catch {
      toast.error("Erro ao reordenar mídias.");
    }
  };

  const handleSaveMetadata = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMedia) return;

    setIsSavingMetadata(true);
    const formData = new FormData(e.currentTarget);
    const alt = formData.get("alt") as string;
    const media_type = formData.get("media_type") as "image" | "video";
    const variant_id = formData.get("variant_id") as string || null;

    try {
      await updateProductMediaMetadata({
        data: {
          id: editingMedia.id,
          alt: alt || null,
          media_type,
          variant_id: variant_id === "none" ? null : variant_id,
        },
      });

      toast.success("Metadados atualizados com sucesso!");
      setEditingMedia(null);
      router.invalidate();
    } catch {
      toast.error("Erro ao atualizar metadados.");
    } finally {
      setIsSavingMetadata(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Galeria de Fotos do Produto</CardTitle>
        <CardDescription>
          Fotos em alta qualidade aumentam a conversão de vendas. Limite de 5MB por arquivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Fazer Upload de Imagem</Label>
          <div className="max-w-md">
            <ImageUpload onChange={handleAddImage} bucket="product-media" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2 border-t border-dashed">
          {product.product_media
            ?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((m: any, idx: number) => {
              const matchedVariant = product.product_variants?.find((v: any) => v.id === m.variant_id);
              const variantText = matchedVariant
                ? `Variação: ${matchedVariant.sku}`
                : "Uso Geral";

              return (
                <div key={m.id || idx} className="relative group border rounded-xl overflow-hidden bg-card shadow-sm flex flex-col justify-between">
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
                    {m.media_type === "video" ? (
                      <video src={m.url} className="w-full h-full object-cover" controls={false} muted />
                    ) : (
                      <img src={m.url} alt={m.alt || ""} className="w-full h-full object-cover" />
                    )}
                    {idx === 0 && (
                      <Badge className="absolute top-2 left-2 text-[10px]" variant="default">
                        Capa
                      </Badge>
                    )}
                    {m.media_type === "video" && (
                      <Badge className="absolute top-2 right-12 text-[10px] bg-red-500 hover:bg-red-600 text-white border-none">
                        Vídeo
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditingMedia(m)}
                      >
                        <Settings className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="size-8"
                        onClick={() => handleDelete(m.id, m.url)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-[11px] font-semibold text-primary truncate">
                      {variantText}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate italic">
                      {m.alt ? `"${m.alt}"` : "Sem legenda"}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, "left")}
                      >
                        <ArrowLeft className="size-3.5" />
                      </Button>
                      <span className="text-[10px] text-muted-foreground font-mono">Pos: {idx + 1}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7"
                        disabled={idx === (product.product_media?.length || 0) - 1}
                        onClick={() => handleMove(idx, "right")}
                      >
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>

      <Dialog open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
        {editingMedia && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Detalhes da Mídia</DialogTitle>
              <DialogDescription>
                Adicione legendas de acessibilidade ou vincule esta imagem a uma variante específica.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveMetadata} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Legenda / Texto Alternativo (Acessibilidade)</Label>
                <Input name="alt" defaultValue={editingMedia.alt || ""} placeholder="Ex: Tênis vermelho de couro sob luz natural" />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Mídia</Label>
                <Select name="media_type" defaultValue={editingMedia.media_type || "image"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vincular à Variante</Label>
                <Select name="variant_id" defaultValue={editingMedia.variant_id || "none"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uso Geral (Vitrine Principal)</SelectItem>
                    {product.product_variants?.map((v: any) => {
                      const attrsText = Object.entries(v.attributes || {})
                        .map(([k, val]) => `${k}: ${val}`)
                        .join(", ");
                      return (
                        <SelectItem key={v.id} value={v.id}>
                          {v.sku} {attrsText ? `(${attrsText})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingMedia(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSavingMetadata}>
                  {isSavingMetadata ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}

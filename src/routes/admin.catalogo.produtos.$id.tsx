import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
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
  ShieldCheck,
  ArrowRight,
  Settings,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
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
    const [res, catsRes] = await Promise.all([
      getProductById({ data: { id: params.id } }),
      listCategories(),
    ]);
    if (res.status === "error") throw new Error(res.message);
    return {
      product: res.data,
      categories: catsRes.status === "ok" ? catsRes.data : [],
    };
  },
  component: EditProductPage,
});

function EditProductPage() {
  const { product, categories } = Route.useLoaderData();

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

      {/* Grid Duplo: Preview (Esquerda) vs Formulário (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LADO ESQUERDO: Live Preview Responsivo */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <Card className="border-primary/20 bg-gradient-to-b from-card to-muted/20 shadow-md overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/40 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Preview em Tempo Real
              </span>
              <Badge variant={liveStatus === "published" ? "default" : "secondary"} className="text-[10px]">
                {liveStatus === "published" ? "Publicado" : liveStatus === "archived" ? "Arquivado" : "Rascunho"}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Image Preview */}
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

              {/* Product Info Preview */}
              <div className="space-y-1.5">
                {liveBrand && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {liveBrand}
                  </span>
                )}
                <h3 className="text-base font-bold text-foreground line-clamp-2">
                  {liveTitle || "Título do produto..."}
                </h3>

                {/* Price Display */}
                <div className="pt-1">
                  <PriceDisplay
                    amountCents={livePriceCents}
                    compareAtCents={liveCompareCents ?? undefined}
                    size="lg"
                  />
                </div>

                {/* Profit Margin Badge if cost provided */}
                {profitMarginPercent !== null && (
                  <div className="pt-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1">
                      <TrendingUp className="size-3.5" /> Margem Estimada: {profitMarginPercent}%
                    </Badge>
                  </div>
                )}
              </div>

              {/* Real Product Variants / Attributes */}
              {attributeKeys.length > 0 ? (
                attributeKeys.map((key) => {
                  const values = Array.from(
                    new Set(
                      (product.product_variants || [])
                        .map((v: any) => v.attributes?.[key])
                        .filter((val: any): val is string => typeof val === "string")
                    )
                  ) as string[];

                  if (values.length === 0) return null;

                  return (
                    <div key={key} className="space-y-1.5 pt-2 border-t border-border/60">
                      <span className="text-xs text-muted-foreground font-medium capitalize">
                        Selecione o(a) {key}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {values.map((val, idx) => (
                          <span
                            key={val}
                            className={`text-xs px-2.5 py-1 rounded-md border text-center font-medium ${
                              idx === 0
                                ? "border-primary bg-primary text-primary-foreground font-bold"
                                : "border-border bg-card text-foreground"
                            }`}
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/60">
                  Nenhum atributo ou tamanho cadastrado.
                </div>
              )}

              {/* Simulated CTA Buttons */}
              <div className="space-y-2 pt-2">
                <Button className="w-full text-xs font-bold" size="sm" type="button">
                  <ShoppingBag className="size-3.5 mr-1.5" />
                  Comprar Agora
                </Button>
                <Button variant="outline" className="w-full text-xs" size="sm" type="button">
                  Adicionar ao Carrinho
                </Button>
              </div>

              {/* Description Preview */}
              {liveDescription && (
                <div className="pt-3 border-t border-border/60">
                  <span className="text-xs text-muted-foreground font-semibold block mb-1">Descrição:</span>
                  <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                    {liveDescription}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* LADO DIREITO: Form & Tabs Workspace */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="geral">Geral & Preço</TabsTrigger>
              <TabsTrigger value="variantes">Variantes ({product.product_variants?.length || 0})</TabsTrigger>
              <TabsTrigger value="midias">Galeria de Mídias ({product.product_media?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="mt-6">
              <GeneralForm
                product={product}
                categories={categories}
                onTitleChange={setLiveTitle}
                onDescriptionChange={setLiveDescription}
                onBrandChange={setLiveBrand}
                onPriceChange={setLivePriceCents}
                onCompareChange={setLiveCompareCents}
                onCostChange={setLiveCostCents}
                onStatusChange={setLiveStatus}
              />
            </TabsContent>

            <TabsContent value="variantes" className="mt-6">
              <VariantsManager product={product} />
            </TabsContent>

            <TabsContent value="midias" className="mt-6">
              <MediaManager product={product} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function GeneralForm({
  product,
  categories,
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
      weight_grams: product.weight_grams || "",
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
    },
  });

  const watchTitle = watch("title");
  const watchDescription = watch("description");
  const watchBrand = watch("brand");
  const watchPrice = watch("price_cents");
  const watchCompare = watch("compare_at_cents");
  const watchCost = watch("cost_cents");
  const watchStatus = watch("status");

  // Re-emit live updates to preview
  useMemo(() => {
    onTitleChange(watchTitle);
  }, [watchTitle]);

  useMemo(() => {
    onDescriptionChange(watchDescription);
  }, [watchDescription]);

  useMemo(() => {
    onBrandChange(watchBrand);
  }, [watchBrand]);

  useMemo(() => {
    const p = parseFloat((watchPrice || "0").replace(",", "."));
    onPriceChange(isNaN(p) ? 0 : Math.round(p * 100));
  }, [watchPrice]);

  useMemo(() => {
    if (!watchCompare) return onCompareChange(null);
    const c = parseFloat(watchCompare.replace(",", "."));
    onCompareChange(isNaN(c) ? null : Math.round(c * 100));
  }, [watchCompare]);

  useMemo(() => {
    if (!watchCost) return onCostChange(null);
    const cost = parseFloat(watchCost.replace(",", "."));
    onCostChange(isNaN(cost) ? null : Math.round(cost * 100));
  }, [watchCost]);

  useMemo(() => {
    onStatusChange(watchStatus);
  }, [watchStatus]);

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
      const weight_grams = values.weight_grams ? parseInt(values.weight_grams, 10) : null;

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
          weight_grams,
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
        },
      });

      if (res.status === "success") {
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
      if (res.status === "success") {
        toast.success("Categoria criada!");
        categories.push(res.data);
        setSelectedCategory(res.data.id);
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
          <div className="space-y-2">
            <Label>Peso Antigo (gramas)</Label>
            <Input type="number" placeholder="Ex: 600" {...register("weight_grams")} />
          </div>
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
          <div className="space-y-2">
            <Label>Prazo de Preparação (dias)</Label>
            <Input {...register("preparation_time_days")} type="number" placeholder="Ex: 0" />
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
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [attrFields, setAttrFields] = useState<{ k: string; v: string }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      sku: "",
      price_override_cents: "",
      cost_cents: "",
      stock_alert_qty: "",
      ean: "",
      weight_kg: "",
      width_cm: "",
      height_cm: "",
      length_cm: "",
      status: "active" as "active" | "inactive" | "archived",
      stock: "",
    },
  });

  const onOpenNew = () => {
    setEditingVariant(null);
    setAttrFields([{ k: "Tamanho", v: "" }]);
    reset({
      sku: `${product.slug}-${(product.product_variants?.length || 0) + 1}`,
      price_override_cents: "",
      cost_cents: "",
      stock_alert_qty: "",
      ean: "",
      weight_kg: "",
      width_cm: "",
      height_cm: "",
      length_cm: "",
      status: "active",
      stock: "0",
    });
    setOpen(true);
  };

  const onOpenEdit = (v: any) => {
    setEditingVariant(v);
    const attrs = v.attributes || {};
    const parsedAttrs = Object.entries(attrs).map(([k, val]) => ({ k, v: String(val) }));
    setAttrFields(parsedAttrs.length > 0 ? parsedAttrs : [{ k: "Tamanho", v: "" }]);
    reset({
      sku: v.sku,
      price_override_cents: v.price_override_cents ? (v.price_override_cents / 100).toFixed(2) : "",
      cost_cents: v.cost_cents ? (v.cost_cents / 100).toFixed(2) : "",
      stock_alert_qty: v.stock_alert_qty !== null && v.stock_alert_qty !== undefined ? String(v.stock_alert_qty) : "",
      ean: v.ean || "",
      weight_kg: v.weight_kg !== null && v.weight_kg !== undefined ? String(v.weight_kg) : "",
      width_cm: v.width_cm !== null && v.width_cm !== undefined ? String(v.width_cm) : "",
      height_cm: v.height_cm !== null && v.height_cm !== undefined ? String(v.height_cm) : "",
      length_cm: v.length_cm !== null && v.length_cm !== undefined ? String(v.length_cm) : "",
      status: v.status || "active",
      stock: String(v.stock_on_hand || 0),
    });
    setOpen(true);
  };

  const onSubmitVariant = async (values: any) => {
    setIsSubmitting(true);
    try {
      const attributes: Record<string, string> = {};
      attrFields.forEach((f) => {
        if (f.k.trim() && f.v.trim()) attributes[f.k.trim()] = f.v.trim();
      });

      const price_override_cents = values.price_override_cents
        ? Math.round(parseFloat(values.price_override_cents.replace(",", ".")) * 100)
        : null;

      const cost_cents = values.cost_cents
        ? Math.round(parseFloat(values.cost_cents.replace(",", ".")) * 100)
        : null;

      const stock_alert_qty = values.stock_alert_qty
        ? parseInt(values.stock_alert_qty, 10)
        : null;

      const weight_kg = values.weight_kg ? parseFloat(values.weight_kg) : null;
      const width_cm = values.width_cm ? parseFloat(values.width_cm) : null;
      const height_cm = values.height_cm ? parseFloat(values.height_cm) : null;
      const length_cm = values.length_cm ? parseFloat(values.length_cm) : null;

      const res = await upsertProductVariant({
        data: {
          id: editingVariant?.id,
          product_id: product.id,
          sku: values.sku,
          barcode: values.ean || null,
          price_override_cents,
          cost_cents,
          stock_alert_qty,
          ean: values.ean || null,
          weight_kg,
          width_cm,
          height_cm,
          length_cm,
          status: values.status,
          attributes,
        },
      });

      if (res.status === "success") {
        const targetStock = parseInt(values.stock || "0", 10);
        const currentStock = editingVariant ? (editingVariant.stock_on_hand || 0) : 0;
        const diff = targetStock - currentStock;

        if (diff !== 0) {
          const adjRes = await adjustStock({
            data: {
              variantId: res.data.id,
              qty: diff,
              movementType: "adjustment",
              note: editingVariant
                ? `Ajuste manual via editor de produtos (anterior: ${currentStock}, novo: ${targetStock})`
                : `Estoque inicial na criação da variante`,
            },
          });
          if (adjRes.status === "error") {
            toast.error("Variante salva, mas falhou ao ajustar estoque: " + adjRes.message);
          }
        }

        toast.success(editingVariant ? "Variante atualizada!" : "Variante criada com estoque!");
        setOpen(false);
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar variante");
      }
    } catch (e) {
      toast.error("Erro inesperado ao salvar variante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Variações de Estoque & Tamanho</CardTitle>
            <CardDescription>SKUs específicos por numeração, cor ou especificação.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <GridBuilderDialog product={product} />
            <Button size="sm" onClick={onOpenNew}>
              <Plus className="mr-1.5 size-4" /> Nova Variante
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!product.product_variants || product.product_variants.length === 0) ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Nenhuma variação cadastrada. Clique em "Nova Variante" para adicionar tamanhos ou cores.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>SKU</TableHead>
                    <TableHead>Atributos / Tamanho</TableHead>
                    <TableHead>Preço Override</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.product_variants.map((v: any) => {
                    const attrsString = Object.entries(v.attributes || {})
                      .map(([k, val]) => `${k}: ${val}`)
                      .join(", ");

                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-xs font-semibold">{v.sku}</TableCell>
                        <TableCell className="text-xs">{attrsString || "Padrão"}</TableCell>
                        <TableCell className="text-xs">
                          {v.price_override_cents ? formatMoney(v.price_override_cents) : "Preço Base"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={v.stock_on_hand > 0 ? "outline" : "destructive"} className="text-xs">
                            {v.stock_on_hand ?? 0} un.
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={v.status === "active" ? "default" : "secondary"} className="text-[10px]">
                            {v.status === "active" ? "Ativo" : v.status === "inactive" ? "Inativo" : "Arquivado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => onOpenEdit(v)}>
                            Editar SKU
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Formulário de Variante */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVariant ? "Editar Variante" : "Nova Variante de Estoque"}</DialogTitle>
            <DialogDescription>Cadastre o SKU, preços específicos e especificações logísticas.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitVariant)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU Único *</Label>
                <Input {...register("sku", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Status da Variante</Label>
                <Select defaultValue="active" onValueChange={(val) => setValue("status", val as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sobretaxa Preço (R$)</Label>
                <Input step="0.01" type="number" placeholder="Preço base se vazio" {...register("price_override_cents")} />
              </div>
              <div className="space-y-2">
                <Label>Custo da Variante (R$)</Label>
                <Input step="0.01" type="number" placeholder="Custo base se vazio" {...register("cost_cents")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estoque Inicial</Label>
                <Input type="number" min="0" placeholder="Ex: 10" {...register("stock")} />
              </div>
              <div className="space-y-2">
                <Label>Estoque Mínimo (Alerta)</Label>
                <Input type="number" min="0" placeholder="Ex: 2" {...register("stock_alert_qty")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Código EAN / GTIN específico</Label>
              <Input placeholder="Ex: 7890000000000" maxLength={14} {...register("ean")} />
            </div>

            <div className="border-t pt-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dimensões da Variante (Caso divirja do Produto)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Peso (kg)</Label>
                  <Input step="0.001" type="number" placeholder="0.000" {...register("weight_kg")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Largura (cm)</Label>
                  <Input step="0.01" type="number" placeholder="0" {...register("width_cm")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Altura (cm)</Label>
                  <Input step="0.01" type="number" placeholder="0" {...register("height_cm")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Comprimento (cm)</Label>
                  <Input step="0.01" type="number" placeholder="0" {...register("length_cm")} />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label>Atributos da Variante</Label>
              {attrFields.map((field, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nome (ex: Tamanho)"
                    value={field.k}
                    onChange={(e) => {
                      const next = [...attrFields];
                      next[index].k = e.target.value;
                      setAttrFields(next);
                    }}
                  />
                  <Input
                    placeholder="Valor (ex: 37)"
                    value={field.v}
                    onChange={(e) => {
                      const next = [...attrFields];
                      next[index].v = e.target.value;
                      setAttrFields(next);
                    }}
                  />
                </div>
              ))}
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Variante"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
      if (res.status === "success") {
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
      const res = await deleteProductMedia({ data: { id: mediaId, url: mediaUrl } });
      if (res.status === "success") {
        toast.success("Mídia removida.");
        router.invalidate();
      } else {
        toast.error(res.message);
      }
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
      const res = await reorderProductMedia({ data: { mediaOrders } });
      if (res.status === "success") {
        toast.success("Ordenação atualizada!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao reordenar mídias.");
      }
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
      const res = await updateProductMediaMetadata({
        data: {
          id: editingMedia.id,
          alt: alt || null,
          media_type,
          variant_id: variant_id === "none" ? null : variant_id,
        },
      });

      if (res.status === "success") {
        toast.success("Metadados atualizados com sucesso!");
        setEditingMedia(null);
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar metadados.");
      }
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

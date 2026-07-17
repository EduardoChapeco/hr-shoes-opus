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
} from "lucide-react";

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
} from "@/components/ui/dialog";

import {
  getProductById,
  updateProduct,
  upsertProductVariant,
  deleteProductMedia,
  addProductMediaLink,
  listCategories,
} from "@/services/admin-catalog.functions";
import { formatMoney } from "@/lib/money";

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
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl font-extrabold text-foreground">
                    {formatMoney(livePriceCents)}
                  </span>
                  {liveCompareCents && liveCompareCents > livePriceCents && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatMoney(liveCompareCents)}
                    </span>
                  )}
                </div>

                {/* Installments Simulation */}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CreditCard className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  ou 3x de {formatMoney(Math.round(livePriceCents / 3))} sem juros no Pix
                </p>

                {/* Profit Margin Badge if cost provided */}
                {profitMarginPercent !== null && (
                  <div className="pt-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1">
                      <TrendingUp className="size-3.5" /> Margem Estimada: {profitMarginPercent}%
                    </Badge>
                  </div>
                )}
              </div>

              {/* Simulated Sizes */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <span className="text-xs text-muted-foreground font-medium">Selecione o Tamanho:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["34", "35", "36", "37", "38", "39"].map((size, idx) => (
                    <span
                      key={size}
                      className={`text-xs px-2.5 py-1 rounded-md border text-center font-medium ${
                        idx === 2
                          ? "border-primary bg-primary text-primary-foreground font-bold"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>

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
              <Label>Categoria Principal</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem Categoria</SelectItem>
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
          <CardTitle className="text-base">Publicação & Logística</CardTitle>
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
            <Label>Peso de Envio (gramas)</Label>
            <Input type="number" placeholder="Ex: 600" {...register("weight_grams")} />
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

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      sku: "",
      price_override_cents: "",
    },
  });

  const onOpenNew = () => {
    setEditingVariant(null);
    setAttrFields([{ k: "Tamanho", v: "" }]);
    reset({
      sku: `${product.slug}-${(product.product_variants?.length || 0) + 1}`,
      price_override_cents: "",
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

      const res = await upsertProductVariant({
        data: {
          id: editingVariant?.id,
          product_id: product.id,
          sku: values.sku,
          price_override_cents,
          attributes,
        },
      });

      if (res.status === "success") {
        toast.success(editingVariant ? "Variante atualizada!" : "Variante criada!");
        setOpen(false);
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar variante");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Variações de Estoque & Tamanho</CardTitle>
            <CardDescription>SKUs específicos por numeração, cor ou especificação.</CardDescription>
          </div>
          <Button size="sm" onClick={onOpenNew}>
            <Plus className="mr-1.5 size-4" /> Nova Variante
          </Button>
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
                    <TableHead>Sobretaxa Preço</TableHead>
                    <TableHead>Estoque Atual</TableHead>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVariant ? "Editar Variante" : "Nova Variante de Estoque"}</DialogTitle>
            <DialogDescription>Cadastre o SKU e os atributos da variação.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitVariant)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>SKU Único *</Label>
              <Input {...register("sku", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Sobretaxa / Preço Específico (R$)</Label>
              <Input step="0.01" type="number" placeholder="Deixe em branco para preço base" {...register("price_override_cents")} />
            </div>

            <div className="space-y-2 pt-2">
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

            <DialogFooter className="pt-4">
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
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddLink = async () => {
    if (!newUrl.trim()) return;
    setIsAdding(true);
    try {
      const res = await addProductMediaLink({ data: { product_id: product.id, url: newUrl } });
      if (res.status === "success") {
        toast.success("Mídia vinculada!");
        setNewUrl("");
        router.invalidate();
      } else {
        toast.error(res.message);
      }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Galeria de Fotos do Produto</CardTitle>
        <CardDescription>Fotos em alta qualidade aumentam a conversão de vendas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder="Cole o URL da imagem (https://...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <Button onClick={handleAddLink} disabled={isAdding || !newUrl.trim()} size="sm">
            Adicionar Imagem
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {product.product_media?.map((m: any, idx: number) => (
            <div key={m.id || idx} className="relative group aspect-square rounded-lg border bg-muted overflow-hidden">
              <img src={m.url} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <Badge className="absolute top-2 left-2 text-[10px]" variant="default">
                  Capa
                </Badge>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(m.id, m.url)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

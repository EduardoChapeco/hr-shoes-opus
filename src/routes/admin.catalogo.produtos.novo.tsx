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
    const [catsRes, typesRes] = await Promise.all([
      listCategories(),
      import("@/services/admin-catalog.functions").then(m => m.listProductTypes())
    ]);
    return {
      categories: catsRes || [],
      productTypes: typesRes || [],
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

  // Gerador Rápido de Variações
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["35", "36", "37", "38"]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [initialStock, setInitialStock] = useState<number>(10);

  const shoeSizes = ["33", "34", "35", "36", "37", "38", "39", "40"];
  const apparelSizes = ["PP", "P", "M", "G", "GG"];
  const popularColors = ["Preto", "Nude", "Branco", "Caramelo", "Off-White", "Vermelho", "Ouro"];

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

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
      type_id: "none",
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const priceCents = parseInt(values.price_cents.replace(/\D/g, ""), 10) || 0;
      const targetSlug = values.slug || slugify(values.title);

      // Geração da matriz de variações rápida
      const variants: { sku: string; attributes: Record<string, any>; stock: number }[] = [];

      if (selectedSizes.length > 0 && selectedColors.length > 0) {
        for (const size of selectedSizes) {
          for (const color of selectedColors) {
            const cleanColor = color.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 3);
            variants.push({
              sku: `${targetSlug}-${cleanColor}-${size}`,
              attributes: { Tamanho: size, Cor: color },
              stock: initialStock,
            });
          }
        }
      } else if (selectedSizes.length > 0) {
        for (const size of selectedSizes) {
          variants.push({
            sku: `${targetSlug}-${size}`,
            attributes: { Tamanho: size },
            stock: initialStock,
          });
        }
      } else if (selectedColors.length > 0) {
        for (const color of selectedColors) {
          const cleanColor = color.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 3);
          variants.push({
            sku: `${targetSlug}-${cleanColor}`,
            attributes: { Cor: color },
            stock: initialStock,
          });
        }
      }
      
      const res = await createProduct({
        data: {
          title: values.title,
          slug: targetSlug,
          price_cents: priceCents,
          status: values.status as "draft" | "published" | "archived",
          category_ids: values.category_id !== "none" ? [values.category_id] : [],
          type_id: values.type_id !== "none" ? values.type_id : null,
          media_urls: mainImageUrl ? [mainImageUrl] : [],
          is_physical: true,
          attributes: {},
          variants: variants.length > 0 ? variants : undefined,
        },
      });

      if (res) {
        toast.success(`Rascunho criado com ${variants.length || 1} variação(ões)!`);
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
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tipo de Produto (Ficha Técnica)</Label>
                <Select defaultValue="none" onValueChange={(val) => setValue("type_id", val)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Selecione um tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Produto Genérico</SelectItem>
                    {Route.useLoaderData().productTypes.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
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

        {/* Card do Gerador Rápido de Variações */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Variações & Estoque Rápido</span>
              <span className="text-xs font-normal text-muted-foreground">
                {selectedSizes.length * (selectedColors.length || 1) || selectedColors.length || 1} variação(ões) selecionada(s)
              </span>
            </CardTitle>
            <CardDescription>
              Marque os tamanhos e cores desejados para gerar a matriz de variações com estoque inicial pronto para venda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seção de Tamanhos Calçados */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-foreground">Tamanhos (Calçados)</Label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedSizes(shoeSizes)} className="text-[11px] text-primary hover:underline font-medium">Todos</button>
                  <span className="text-[11px] text-muted-foreground">|</span>
                  <button type="button" onClick={() => setSelectedSizes([])} className="text-[11px] text-muted-foreground hover:underline font-medium">Limpar</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {shoeSizes.map(size => {
                  const active = selectedSizes.includes(size);
                  return (
                    <button
                      type="button"
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`h-9 min-w-10 px-3 rounded-lg text-sm font-semibold border transition-all ${
                        active ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105" : "bg-background text-muted-foreground border-input hover:border-primary/50"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seção de Cores Populares */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-foreground">Cores Principais (Opcional)</Label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedColors(popularColors)} className="text-[11px] text-primary hover:underline font-medium">Todas</button>
                  <span className="text-[11px] text-muted-foreground">|</span>
                  <button type="button" onClick={() => setSelectedColors([])} className="text-[11px] text-muted-foreground hover:underline font-medium">Limpar</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularColors.map(color => {
                  const active = selectedColors.includes(color);
                  return (
                    <button
                      type="button"
                      key={color}
                      onClick={() => toggleColor(color)}
                      className={`h-9 px-3 rounded-lg text-xs font-medium border transition-all ${
                        active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background text-muted-foreground border-input hover:border-primary/50"
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuração do Estoque Inicial por Variação */}
            <div className="pt-2 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-semibold">Estoque Inicial por Variação</Label>
                <p className="text-xs text-muted-foreground">Quantidade reservável alocada para cada tamanho/cor selecionada.</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="999"
                  value={initialStock}
                  onChange={e => setInitialStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-24 h-10 text-center font-bold text-base"
                />
                <span className="text-xs text-muted-foreground font-medium">unidades / variação</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

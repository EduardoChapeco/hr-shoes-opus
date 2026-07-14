import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";

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
  DialogTrigger,
} from "@/components/ui/dialog";

import { getProductById, updateProduct, upsertProductVariant } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/produtos/$id")({
  head: () => ({ meta: [{ title: "Editar Produto — Hr Shoes" }] }),
  loader: async ({ params }) => {
    const res = await getProductById({ data: { id: params.id } });
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: EditProductPage,
});

function EditProductPage() {
  const product = Route.useLoaderData();
  const router = useRouter();

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        eyebrow="Catálogo"
        title={product.title}
        description="Edite os detalhes, preços e variações de SKU deste produto."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/catalogo/produtos">
              <ArrowLeft className="mr-2 size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="variantes">Variantes (SKUs)</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-6">
          <GeneralForm product={product} />
        </TabsContent>

        <TabsContent value="variantes" className="mt-6">
          <VariantsManager product={product} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralForm({ product }: { product: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: product.title,
      description: product.description || "",
      brand: product.brand || "",
      price_cents: (product.price_cents / 100).toFixed(2),
      compare_at_cents: product.compare_at_cents ? (product.compare_at_cents / 100).toFixed(2) : "",
      status: product.status,
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const price_cents = Math.round(parseFloat(values.price_cents.replace(",", ".")) * 100);
      const compare_at_cents = values.compare_at_cents
        ? Math.round(parseFloat(values.compare_at_cents.replace(",", ".")) * 100)
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
        },
      });

      if (res.status === "success") {
        toast.success("Produto atualizado com sucesso!");
      } else {
        toast.error(res.message || "Erro ao atualizar");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título do Produto</Label>
                <Input {...register("title", { required: "Obrigatório" })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea {...register("description")} rows={5} />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input {...register("brand")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Precificação (Base)</CardTitle>
              <CardDescription>
                O preço base do produto. Variantes podem ter preços específicos.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço de Venda (R$)</Label>
                <Input
                  step="0.01"
                  type="number"
                  {...register("price_cents", { required: "Obrigatório" })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço de Comparação (R$)</Label>
                <Input step="0.01" type="number" {...register("compare_at_cents")} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status e Organização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  defaultValue={product.status}
                  onValueChange={(val) => setValue("status", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Alterações"}
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

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      sku: "",
      status: "active",
      attributes: "", // Will be parsed as JSON for simplicity here, or key/value pairs
      price_override_cents: "",
    },
  });

  const onOpenNew = () => {
    setEditingVariant(null);
    reset({
      sku: `${product.slug}-${product.product_variants.length + 1}`,
      status: "active",
      attributes: '{"tamanho": "39"}',
      price_override_cents: "",
    });
    setOpen(true);
  };

  const onOpenEdit = (v: any) => {
    setEditingVariant(v);
    reset({
      sku: v.sku,
      status: v.status,
      attributes: JSON.stringify(v.attributes),
      price_override_cents: v.price_override_cents ? (v.price_override_cents / 100).toFixed(2) : "",
    });
    setOpen(true);
  };

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      let attrs = {};
      try {
        attrs = JSON.parse(values.attributes);
      } catch (e) {
        toast.error("Atributos devem ser um JSON válido");
        setIsSubmitting(false);
        return;
      }

      const price_override_cents = values.price_override_cents
        ? Math.round(parseFloat(values.price_override_cents.replace(",", ".")) * 100)
        : null;

      const res = await upsertProductVariant({
        data: {
          id: editingVariant?.id,
          product_id: product.id,
          sku: values.sku,
          status: values.status,
          price_override_cents,
          attributes: attrs,
        },
      });

      if (res.status === "success") {
        toast.success("Variante salva com sucesso!");
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Variações do Produto (SKUs)</CardTitle>
          <CardDescription>
            Gerencie tamanhos, cores e outras variações que possuem estoque separado.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={onOpenNew} size="sm">
              <Plus className="mr-2 size-4" />
              Adicionar Variante
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingVariant ? "Editar Variante" : "Nova Variante"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input {...register("sku", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Atributos Específicos (JSON)</Label>
                <Textarea {...register("attributes")} placeholder='{"tamanho": "39", "cor": "Preto"}' />
                <p className="text-xs text-muted-foreground">Formato JSON estrito com aspas duplas.</p>
              </div>
              <div className="space-y-2">
                <Label>Preço Específico (R$)</Label>
                <Input step="0.01" type="number" {...register("price_override_cents")} placeholder="Opcional. Substitui o preço base." />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select onValueChange={(v) => setValue("status", v)} defaultValue="active">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>Salvar Variante</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Atributos</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.product_variants.map((variant: any) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{variant.sku}</TableCell>
                  <TableCell>
                    {Object.entries(variant.attributes || {}).map(([k, v]) => (
                      <Badge key={k} variant="outline" className="mr-1">
                        {k}: {String(v)}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    {variant.price_override_cents
                      ? `R$ ${(variant.price_override_cents / 100).toFixed(2)}`
                      : "Padrão"}
                  </TableCell>
                  <TableCell>
                    {variant.stock_on_hand} un
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant.status === "active" ? "default" : "secondary"}>
                      {variant.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onOpenEdit(variant)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

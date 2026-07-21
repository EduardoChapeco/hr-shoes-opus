import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertProductVariant } from "@/services/admin-catalog.functions";
import { adjustStock } from "@/services/stock.functions";
import { useRouter } from "@tanstack/react-router";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";

export function VariantFormRow({ 
  variant, 
  productId, 
  onClose 
}: { 
  variant?: any; 
  productId: string; 
  onClose: () => void 
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attrFields, setAttrFields] = useState<{ k: string; v: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      sku: variant?.sku || "",
      price_override_cents: variant?.price_override_cents ? (variant.price_override_cents / 100).toFixed(2) : "",
      cost_cents: variant?.cost_cents ? (variant.cost_cents / 100).toFixed(2) : "",
      stock: variant?.stock_on_hand?.toString() || "",
      stock_alert_qty: variant?.stock_alert_qty?.toString() || "",
      ean: variant?.ean || "",
      weight_kg: variant?.weight_kg?.toString() || "",
      width_cm: variant?.width_cm?.toString() || "",
      height_cm: variant?.height_cm?.toString() || "",
      length_cm: variant?.length_cm?.toString() || "",
      display_name: variant?.display_name || "",
      status: variant?.status || "active",
    },
  });

  useEffect(() => {
    if (variant?.attributes) {
      const arr = Object.entries(variant.attributes).map(([k, v]) => ({ k, v: String(v) }));
      if (arr.length === 0) arr.push({ k: "", v: "" });
      setAttrFields(arr);
    } else {
      setAttrFields([{ k: "", v: "" }]);
    }
  }, [variant]);

  const onSubmitVariant = async (values: any) => {
    setIsSubmitting(true);
    try {
      const attributes = attrFields.reduce((acc, curr) => {
        const key = curr.k.trim();
        const val = curr.v.trim();
        if (key && val) acc[key] = val;
        return acc;
      }, {} as Record<string, string>);

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
          id: variant?.id,
          product_id: productId,
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
          display_name: values.display_name || null,
          status: values.status,
          attributes,
        },
      });

      if (res) {
        const targetStock = parseInt(values.stock || "0", 10);
        const currentStock = variant ? (variant.stock_on_hand || 0) : 0;
        const diff = targetStock - currentStock;

        try {
          if (diff !== 0) {
            await adjustStock({
              data: {
                variantId: res.id,
                qty: diff,
                movementType: "adjustment",
                note: variant
                  ? `Ajuste manual via editor de produtos (anterior: ${currentStock}, novo: ${targetStock})`
                  : `Estoque inicial na criação da variante`,
              },
            });
          }
        } catch (adjErr: any) {
          toast.error("Variante salva, mas falhou ao ajustar estoque: " + adjErr.message);
        }

        toast.success(variant ? "Variante atualizada!" : "Variante criada!");
        onClose();
        router.invalidate();
      }
    } catch (e) {
      toast.error("Erro inesperado ao salvar variante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitVariant)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>SKU Único *</Label>
          <Input {...register("sku", { required: true })} />
        </div>
        <div className="space-y-2">
          <Label>Nome de Exibição (Opcional)</Label>
          <Input placeholder="Ex: Rosa Bebê" {...register("display_name")} />
        </div>
        <div className="space-y-2">
          <Label>Status da Variante</Label>
          <Select defaultValue={variant?.status || "active"} onValueChange={(val) => setValue("status", val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Código EAN / GTIN específico</Label>
          <Input placeholder="Ex: 7890000000000" maxLength={14} {...register("ean")} />
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
          <div className="flex flex-col mb-2">
            <Label>Estoque Total</Label>
            {variant && (
              <div className="text-[10px] mt-1 flex gap-2 font-medium text-muted-foreground">
                <span className="text-primary font-bold">Disponível: {(variant.stock_on_hand || 0) - (variant.stock_reserved || 0)}</span>
                <span>|</span>
                <span>Reservado: {variant.stock_reserved || 0}</span>
                <span>|</span>
                <span>Total: {variant.stock_on_hand || 0}</span>
              </div>
            )}
          </div>
          <Input type="number" min="0" placeholder="Ajustar total" {...register("stock")} />
          <p className="text-[10px] text-muted-foreground mt-1">Este valor altera o estoque total real. O disponível será recalculado.</p>
        </div>
        <div className="space-y-2">
          <Label>Estoque Mínimo (Alerta)</Label>
          <Input type="number" min="0" placeholder="Ex: 2" {...register("stock_alert_qty")} />
        </div>
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

      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label>Atributos da Variante</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAttrFields([...attrFields, { k: "", v: "" }])}
            className="h-7 text-xs"
          >
            <Plus className="mr-1 size-3" /> Adicionar
          </Button>
        </div>
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
              className="flex-1"
            />
            <Input
              placeholder="Valor (ex: 37)"
              value={field.v}
              onChange={(e) => {
                const next = [...attrFields];
                next[index].v = e.target.value;
                setAttrFields(next);
              }}
              className="flex-1"
            />
            {attrFields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = attrFields.filter((_, i) => i !== index);
                  setAttrFields(next);
                }}
                className="size-9 text-destructive shrink-0 hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-muted/40 border rounded-md flex items-start gap-3">
        <ImageIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-medium">Fotos para esta Variação</p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Para adicionar fotos exclusivas desta variação, salve-a primeiro. Depois, role até a seção <span className="font-semibold">Galeria de Fotos do Produto</span> abaixo, faça o upload da imagem e clique no botão de engrenagem para "Vincular à Variante".
          </p>
        </div>
      </div>

      <div className="pt-4 border-t flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Variante"}
        </Button>
      </div>
    </form>
  );
}

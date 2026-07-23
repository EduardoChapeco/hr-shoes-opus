import React, { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { ImageUpload } from "@/components/ui/image-upload";
import { updateProductMediaMetadata } from "@/services/admin-catalog.functions";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

interface VariantListGridProps {
  product: any;
  onEditVariant: (variantId: string | null) => void;
}

export function VariantListGrid({ product, onEditVariant }: VariantListGridProps) {
  const router = useRouter();
  const variants = product?.product_variants || [];

  const handleUploadImage = async (url: string, variantId: string) => {
    try {
      // Cria a mídia associada ao variante chamando o batchUpsert ou
      // criando diretamente no product_media se tivéssemos um RPC.
      // O modo mais fácil aqui é chamar o batchUpsertVariantMatrix pra atualizar só a url.
      const { batchUpsertVariantMatrix } = await import("@/services/admin-catalog.functions");
      
      const targetVariant = variants.find((v: any) => v.id === variantId);
      if (!targetVariant) return;

      await batchUpsertVariantMatrix({
        data: {
          product_id: product.id,
          matrix: [{
            sku: targetVariant.sku,
            attributes: targetVariant.attributes || {},
            price_override_cents: targetVariant.price_override_cents,
            stock: (targetVariant.stock_on_hand || 0) - (targetVariant.stock_reserved || 0),
            image_url: url
          }]
        }
      });

      toast.success("Imagem vinculada à variante!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao vincular imagem.");
    }
  };

  if (variants.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground">
        Nenhuma variação cadastrada. Use o Modo Rápido para gerar ou crie uma nova.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-[80px]">Imagem</TableHead>
            <TableHead>Variante</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((v: any) => {
            const attrsString = Object.entries(v.attributes || {})
              .map(([k, val]) => `${val}`)
              .join(" / ");
            
            const availableQty = Math.max(0, (v.stock_on_hand || 0) - (v.stock_reserved || 0));
            
            // Procura se tem mídia pra essa variante
            const media = product.product_media?.find((m: any) => m.variant_id === v.id);

            return (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="w-10 h-10 relative rounded border overflow-hidden bg-muted group">
                    {media ? (
                      <img src={media.url} alt="Variant" className="w-full h-full object-cover" />
                    ) : (
                      <ImageUpload 
                        onChange={(url: string) => handleUploadImage(url, v.id)} 
                        bucket="product-media" 
                        className="h-full border-0 bg-transparent rounded-none" 
                      />

                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {v.display_name || attrsString || "Padrão"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {v.sku}
                </TableCell>
                <TableCell className="text-sm">
                  {v.price_override_cents ? formatMoney(v.price_override_cents) : "Herdado"}
                </TableCell>
                <TableCell className="text-sm">
                  {availableQty} {availableQty <= (v.stock_alert_qty || 0) && <span className="text-destructive font-bold text-xs ml-1">(Baixo)</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEditVariant(v.id)}>
                    <Edit className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

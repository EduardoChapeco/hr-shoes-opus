import React, { useState, useMemo, useEffect } from "react";
import { X, Sparkles, Copy, LayoutGrid, DollarSign, Barcode, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { formatMoney } from "@/lib/money";

export type RawVariant = {
  id?: string;
  sku?: string;
  attributes: Record<string, string>;
  stock: number;
  price_override_cents?: number | null;
  image_url?: string | null;
};

interface VariantMatrixGridProps {
  variants: RawVariant[];
  onChange: (variants: RawVariant[]) => void;
  basePriceCents: number;
}

type ViewMode = "stock" | "price" | "sku";

/**
 * Pure function to generate a 2D Pivot Map from a 1D Flat Array.
 * Exposed for rigorous algorithmic unit testing to ensure lossless data mapping.
 */
export function generatePivotData(variants: RawVariant[], rowKey: string, colKeys: string[]) {
  const rowValues = new Set<string>();
  const colValues = new Set<string>();

  variants.forEach((v) => {
    rowValues.add(v.attributes[rowKey] ?? "N/A");
    const colLabel = colKeys.map((k) => v.attributes[k] ?? "N/A").join(" / ");
    colValues.add(colLabel);
  });

  const rows = Array.from(rowValues).sort();
  const cols = Array.from(colValues).sort();

  const matrix = new Map<string, Map<string, RawVariant>>();
  rows.forEach((r) => matrix.set(r, new Map<string, RawVariant>()));

  variants.forEach((v) => {
    const rVal = v.attributes[rowKey] ?? "N/A";
    const cVal = colKeys.map((k) => v.attributes[k] ?? "N/A").join(" / ");
    matrix.get(rVal)?.set(cVal, v);
  });

  return { rows, cols, matrix };
}

/**
 * 2D Pivot Matrix Grid for Footwear Variations.
 * Automatically transforms flat arrays (e.g. Color x Size) into a 2D Spreadsheet,
 * enabling ultra-fast keyboard entry, visual image cascading, and smart bulk presets.
 */
export function VariantMatrixGrid({ variants, onChange, basePriceCents }: VariantMatrixGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("stock");

  // Determine dimension keys (e.g. ["Cor", "Tamanho"])
  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach((v) => Object.keys(v.attributes).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [variants]);

  // If 0 or 1 attribute, fallback to a flat list display instead of 2D Matrix
  const is1D = attributeKeys.length <= 1;
  const rowKey = attributeKeys[0]; // Primary attribute (e.g., "Cor")
  const colKeys = attributeKeys.slice(1); // Secondary attributes (e.g., "Tamanho")

  // Generate unique Rows and Columns
  const pivotData = useMemo(() => {
    if (is1D) return null;
    return generatePivotData(variants, rowKey, colKeys);
  }, [variants, is1D, rowKey, colKeys]);

  if (variants.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-xl border-dashed">
        <EyeOff className="size-8 mx-auto mb-2 opacity-50" />
        Nenhuma variação definida. Crie atributos primeiro.
      </div>
    );
  }

  // --- 1D Flat List (Fallback) ---
  if (is1D || !pivotData) {
    return (
      <div className="border rounded-xl overflow-x-auto bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Imagem</th>
              <th className="px-4 py-3">Variação</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Preço Exceção</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {variants.map((variant, idx) => (
              <tr key={variant.id || idx} className="hover:bg-muted/30 transition-colors">
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
                        onClick={() => {
                          const newVariants = [...variants];
                          newVariants[idx].image_url = null;
                          onChange(newVariants);
                        }}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12">
                      <ImageUpload
                        onChange={(url: string) => {
                          const newVariants = [...variants];
                          newVariants[idx].image_url = url;
                          onChange(newVariants);
                        }}
                        bucket="product-media"
                        className="h-full w-full p-0 min-h-[48px] rounded-md"
                      />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">
                  {Object.values(variant.attributes).join(" / ")}
                </td>
                <td className="px-4 py-2 w-32">
                  <Input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[idx].stock = parseInt(e.target.value) || 0;
                      onChange(newVariants);
                    }}
                    className="h-9 font-mono text-center bg-background"
                  />
                </td>
                <td className="px-4 py-2 w-48">
                  <Input
                    type="text"
                    value={variant.sku || ""}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[idx].sku = e.target.value;
                      onChange(newVariants);
                    }}
                    placeholder="Auto gerado"
                    className="h-9 font-mono text-xs bg-background"
                  />
                </td>
                <td className="px-4 py-2 w-40">
                  <Input
                    type="number"
                    step="0.01"
                    value={
                      variant.price_override_cents
                        ? (variant.price_override_cents / 100).toFixed(2)
                        : ""
                    }
                    onChange={(e) => {
                      const newVariants = [...variants];
                      const val = parseFloat(e.target.value);
                      newVariants[idx].price_override_cents = isNaN(val)
                        ? null
                        : Math.round(val * 100);
                      onChange(newVariants);
                    }}
                    placeholder={`Base: ${formatMoney(basePriceCents)}`}
                    className="h-9 font-mono text-xs bg-background"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // --- 2D Pivot Matrix Grid ---
  const { rows, cols, matrix } = pivotData;

  const handleCellUpdate = (
    rowVal: string,
    colVal: string,
    field: "stock" | "sku" | "price_override_cents",
    value: any,
  ) => {
    const newVariants = variants.map((v) => {
      const r = v.attributes[rowKey] ?? "N/A";
      const c = colKeys.map((k) => v.attributes[k] ?? "N/A").join(" / ");
      if (r === rowVal && c === colVal) {
        return { ...v, [field]: value };
      }
      return v;
    });
    onChange(newVariants);
  };

  const handleRowImageUpdate = (rowVal: string, imageUrl: string | null) => {
    // In footwear, all sizes of a color share the same image!
    const newVariants = variants.map((v) => {
      const r = v.attributes[rowKey] ?? "N/A";
      if (r === rowVal) {
        return { ...v, image_url: imageUrl };
      }
      return v;
    });
    onChange(newVariants);
  };

  const handlePreFillCurve = (rowVal: string) => {
    // Example Footwear Curve: 1, 2, 3, 3, 2, 1 distribution based on available columns
    const curvePattern = [1, 2, 3, 3, 2, 1];
    let totalAssigned = 0;
    const newVariants = variants.map((v) => {
      const r = v.attributes[rowKey] ?? "N/A";
      const c = colKeys.map((k) => v.attributes[k] ?? "N/A").join(" / ");
      if (r === rowVal) {
        const colIdx = cols.indexOf(c);
        const stockValue = curvePattern[colIdx % curvePattern.length] || 1;
        totalAssigned += stockValue;
        return { ...v, stock: stockValue };
      }
      return v;
    });
    onChange(newVariants);
  };

  const handleDuplicateRow = (sourceRowVal: string, targetRowVal: string) => {
    const sourceData = matrix.get(sourceRowVal);
    if (!sourceData) return;

    const newVariants = variants.map((v) => {
      const r = v.attributes[rowKey] ?? "N/A";
      const c = colKeys.map((k) => v.attributes[k] ?? "N/A").join(" / ");
      if (r === targetRowVal) {
        const sourceVariant = sourceData.get(c);
        if (sourceVariant) {
          return {
            ...v,
            stock: sourceVariant.stock,
            price_override_cents: sourceVariant.price_override_cents,
          };
        }
      }
      return v;
    });
    onChange(newVariants);
  };

  return (
    <div className="space-y-4">
      {/* Visual Toggles & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-1 bg-muted/30 rounded-lg border">
        <div className="flex items-center p-1 bg-card border rounded-md shadow-sm">
          <Button
            type="button"
            variant={viewMode === "stock" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("stock")}
            className="h-8 text-xs gap-1.5"
          >
            <LayoutGrid className="size-3.5" />
            Estoque
          </Button>
          <Button
            type="button"
            variant={viewMode === "price" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("price")}
            className="h-8 text-xs gap-1.5"
          >
            <DollarSign className="size-3.5" />
            Preços
          </Button>
          <Button
            type="button"
            variant={viewMode === "sku" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("sku")}
            className="h-8 text-xs gap-1.5"
          >
            <Barcode className="size-3.5" />
            SKUs / EANs
          </Button>
        </div>
        <div className="px-3 text-xs text-muted-foreground flex items-center gap-2">
          <Badge variant="outline" className="bg-background text-[10px]">
            Dica
          </Badge>
          <span>
            Use <kbd className="border bg-card px-1 rounded mx-0.5">TAB</kbd> para navegar e
            preencher ultra-rápido.
          </span>
        </div>
      </div>

      <div className="border rounded-xl overflow-x-auto bg-card shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold">
            <tr>
              <th className="px-4 py-3 font-medium bg-muted/60 sticky left-0 z-10 w-48 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                {rowKey}{" "}
                <span className="text-[10px] font-normal lowercase opacity-70 ml-1">
                  (Linha Mestra)
                </span>
              </th>
              {cols.map((c) => (
                <th key={c} className="px-3 py-3 text-center whitespace-nowrap min-w-[80px]">
                  {c}
                </th>
              ))}
              <th className="px-4 py-3 text-right bg-muted/20 w-32">Total / Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((r, rowIdx) => {
              const rowVariants = matrix.get(r);
              if (!rowVariants) return null;

              // Find the first variant in the row to grab the shared image_url
              const firstVariant = Array.from(rowVariants.values())[0];
              const sharedImage = firstVariant?.image_url;
              const rowStockTotal = Array.from(rowVariants.values()).reduce(
                (acc, v) => acc + (v.stock || 0),
                0,
              );

              return (
                <tr key={r} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 font-medium sticky left-0 z-10 bg-card shadow-[1px_0_0_0_rgba(0,0,0,0.05)] flex items-center gap-3 min-w-48">
                    {sharedImage ? (
                      <div className="relative group size-11 rounded overflow-hidden border shrink-0">
                        <img src={sharedImage} alt={r} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRowImageUpdate(r, null)}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="size-11 shrink-0">
                        <ImageUpload
                          onChange={(url: string) => handleRowImageUpdate(r, url)}
                          bucket="product-media"
                          className="h-full w-full p-0 rounded border-dashed"
                        />
                      </div>
                    )}
                    <span className="truncate" title={r}>
                      {r}
                    </span>
                  </td>

                  {cols.map((c) => {
                    const variant = rowVariants.get(c);
                    if (!variant) return <td key={c} className="bg-muted/10"></td>;

                    return (
                      <td key={c} className="px-2 py-2 align-middle">
                        {viewMode === "stock" && (
                          <Input
                            type="number"
                            min="0"
                            value={variant.stock === 0 ? "" : variant.stock}
                            placeholder="0"
                            onChange={(e) =>
                              handleCellUpdate(r, c, "stock", parseInt(e.target.value) || 0)
                            }
                            className="h-9 font-mono text-center transition-all focus:ring-primary focus:border-primary border-transparent bg-muted/40 hover:bg-muted/60"
                          />
                        )}
                        {viewMode === "price" && (
                          <Input
                            type="number"
                            step="0.01"
                            value={
                              variant.price_override_cents
                                ? (variant.price_override_cents / 100).toFixed(2)
                                : ""
                            }
                            placeholder="Base"
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleCellUpdate(
                                r,
                                c,
                                "price_override_cents",
                                isNaN(val) ? null : Math.round(val * 100),
                              );
                            }}
                            className={`h-9 font-mono text-center text-xs transition-all border-transparent focus:ring-primary focus:border-primary ${variant.price_override_cents ? "bg-amber-500/10 text-amber-700 font-bold" : "bg-muted/40 hover:bg-muted/60 text-muted-foreground"}`}
                          />
                        )}
                        {viewMode === "sku" && (
                          <Input
                            type="text"
                            value={variant.sku || ""}
                            placeholder="Gerado"
                            onChange={(e) =>
                              handleCellUpdate(r, c, "sku", e.target.value || undefined)
                            }
                            className="h-9 font-mono text-center text-[10px] bg-muted/40 hover:bg-muted/60 border-transparent focus:ring-primary focus:border-primary"
                          />
                        )}
                      </td>
                    );
                  })}

                  <td className="px-4 py-3 text-right bg-muted/5 flex items-center justify-end gap-2 h-full min-h-[60px]">
                    <span className="font-mono text-sm font-bold text-muted-foreground w-10 text-center bg-background rounded border px-2 py-1">
                      {rowStockTotal}
                    </span>

                    {viewMode === "stock" && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreFillCurve(r)}
                          title="Preencher Lote Padrão de Calçados (Curva)"
                          className="size-7 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Sparkles className="size-3.5" />
                        </Button>
                        {rowIdx > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicateRow(rows[rowIdx - 1], r)}
                            title={`Copiar valores da linha superior (${rows[rowIdx - 1]})`}
                            className="size-7 rounded hover:bg-muted-foreground/10 transition-colors"
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

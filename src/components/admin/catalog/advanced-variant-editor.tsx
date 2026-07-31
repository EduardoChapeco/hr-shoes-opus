import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RawVariant } from "./variant-matrix-grid";
import { formatMoney } from "@/lib/money";

interface AdvancedVariantEditorProps {
  variant: RawVariant;
  basePriceCents: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedVariant: RawVariant) => void;
}

export function AdvancedVariantEditor({
  variant,
  basePriceCents,
  isOpen,
  onClose,
  onSave,
}: AdvancedVariantEditorProps) {
  const [formData, setFormData] = React.useState<RawVariant>(variant);

  React.useEffect(() => {
    setFormData(variant);
  }, [variant]);

  const handleChange = (field: keyof RawVariant, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edição Avançada da Variação</DialogTitle>
          <DialogDescription>
            Atributos: {Object.entries(formData.attributes).map(([k, v]) => `${k}: ${v}`).join(" | ")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>SKU</Label>
            <Input 
              value={formData.sku || ""} 
              onChange={(e) => handleChange("sku", e.target.value)} 
              placeholder="Gerado automaticamente se vazio"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Código de Barras (EAN / GTIN)</Label>
            <Input 
              value={formData.ean || ""} 
              onChange={(e) => handleChange("ean", e.target.value)} 
              placeholder="Ex: 7891020304050"
            />
          </div>

          <div className="space-y-2">
            <Label>Preço de Venda Específico</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                step="0.01"
                className="pl-8"
                value={formData.price_override_cents != null ? (formData.price_override_cents / 100).toFixed(2) : ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleChange("price_override_cents", isNaN(val) ? null : Math.round(val * 100));
                }}
                placeholder={`Base: ${formatMoney(basePriceCents)}`}
              />
            </div>
            <p className="text-xs text-muted-foreground">Deixe em branco para herdar o preço do produto mãe.</p>
          </div>

          <div className="space-y-2">
            <Label>Preço de Custo (Margem)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                step="0.01"
                className="pl-8"
                value={formData.cost_cents != null ? (formData.cost_cents / 100).toFixed(2) : ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleChange("cost_cents", isNaN(val) ? null : Math.round(val * 100));
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Peso Logístico (Kg)</Label>
            <Input 
              type="number"
              step="0.001"
              value={formData.weight_kg || ""} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                handleChange("weight_kg", isNaN(val) ? null : val);
              }}
              placeholder="Ex: 0.350 (350 gramas)"
            />
          </div>

          <div className="space-y-2">
            <Label>Status da Variação</Label>
            <select
              className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.status || "active"}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="active">Ativo (Visível)</option>
              <option value="inactive">Inativo (Oculto)</option>
            </select>
          </div>

          <div className="col-span-2 border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-3">Venda Sob Encomenda (Backorders)</h4>
            <div className="space-y-4 bg-muted/30 p-4 rounded-md">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_backorder"
                  checked={formData.allow_backorder || false}
                  onCheckedChange={(checked) => handleChange("allow_backorder", checked === true)}
                />
                <Label htmlFor="allow_backorder" className="cursor-pointer">
                  Permitir venda sem estoque (Sob Encomenda)
                </Label>
              </div>

              {formData.allow_backorder && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                    <Label>Dias Adicionais de Preparo (Lead Time)</Label>
                    <Input
                      type="number"
                      value={formData.backorder_lead_time_days || 0}
                      onChange={(e) => handleChange("backorder_lead_time_days", parseInt(e.target.value) || 0)}
                      placeholder="Ex: 15"
                    />
                    <p className="text-[10px] text-muted-foreground">Adicionado ao prazo de frete.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Reserva sem pagamento?</Label>
                    <select
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={formData.requires_payment_for_backorder === false ? "false" : "true"}
                      onChange={(e) =>
                        handleChange("requires_payment_for_backorder", e.target.value === "true")
                      }
                    >
                      <option value="true">Exigir Pagamento Normal</option>
                      <option value="false">Permitir Reserva sem Sinal</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações Locais</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

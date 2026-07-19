import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Importa a função que gera as cruzas de variantes.
import { generateVariantGrid } from "@/services/admin-catalog.functions";

export function GridBuilderDialog({ product }: { product: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [options, setOptions] = useState<{ name: string; values: string }[]>([
    { name: "Tamanho", values: "" },
    { name: "Cor", values: "" }
  ]);

  // Preenche opções baseadas no tipo do produto quando o modal abre
  useEffect(() => {
    if (open && product?.product_types?.field_schema) {
      const variantGroups = product.product_types.field_schema.filter((f: any) => f.kind === "option_group");
      if (variantGroups.length > 0) {
        setOptions(variantGroups.map((g: any) => ({
          name: g.name,
          values: (g.options || []).join(", ")
        })));
      }
    }
  }, [open, product]);

  const handleGenerate = async () => {
    const validOptions = options
      .map((o) => ({
        name: o.name.trim(),
        values: o.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((o) => o.name && o.values.length > 0);

    if (validOptions.length === 0) {
      toast.error("Adicione pelo menos uma opção com valores.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await generateVariantGrid({
        data: {
          productId: product.id,
          options: validOptions,
        },
      });
      if (res.status === "success") {
        toast.success(`Foram geradas ${res.data.length} novas variantes!`);
        setOpen(false);
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao gerar grades");
      }
    } catch (e) {
      toast.error("Falha inesperada ao gerar grades");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="mr-1.5 size-4" /> Gerador de Grade
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerador Automático de Grades</DialogTitle>
          <DialogDescription>
            Crie opções (como Tamanho e Cor) e geraremos todas as combinações de variantes automaticamente, prontas para venda.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {options.map((opt, i) => (
            <div key={i} className="flex flex-col gap-2 p-3 border rounded-md">
              <div className="flex justify-between items-center">
                <Label>Opção {i + 1} (ex: Cor)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-destructive"
                  onClick={() => setOptions((opts) => opts.filter((_, idx) => idx !== i))}
                >
                  Remover
                </Button>
              </div>
              <Input
                placeholder="Nome da opção"
                value={opt.name}
                onChange={(e) =>
                  setOptions((opts) => opts.map((o, idx) => (idx === i ? { ...o, name: e.target.value } : o)))
                }
              />
              <Label className="text-xs text-muted-foreground mt-2">
                Valores (separados por vírgula)
              </Label>
              <Input
                placeholder="ex: Preto, Branco, Vermelho"
                value={opt.values}
                onChange={(e) =>
                  setOptions((opts) =>
                    opts.map((o, idx) => (idx === i ? { ...o, values: e.target.value } : o))
                  )
                }
              />
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setOptions([...options, { name: "", values: "" }])}
          >
            <Plus className="mr-2 size-4" /> Adicionar Opção
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Gerar Combinações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

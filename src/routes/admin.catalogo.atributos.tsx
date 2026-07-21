import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Settings2,
  Sparkles,
  Layers,
  CheckCircle2,
  Tag,
  Palette,
  Ruler,
  SlidersHorizontal,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { EmptyState } from "@/components/state/states";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { listProductTypes, createProductType, updateProductType } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/atributos")({
  head: () => ({ meta: [{ title: "Grupos de Opções & Atributos — Hr Shoes" }] }),
  loader: async () => {
    return await listProductTypes();
  },
  component: AtributosPage,
});

const PRESET_OPTION_GROUPS = [
  {
    id: "sizes-fem",
    title: "Tamanhos Femininos (Calçados)",
    icon: Ruler,
    options: ["34", "35", "36", "37", "38", "39"],
    category: "Calçados",
  },
  {
    id: "sizes-masc",
    title: "Tamanhos Masculinos (Calçados)",
    icon: Ruler,
    options: ["37", "38", "39", "40", "41", "42", "43", "44"],
    category: "Calçados",
  },
  {
    id: "colors-basic",
    title: "Cores Neutras e Básicas",
    icon: Palette,
    options: ["Preto", "Branco", "Nude", "Bege", "Caramelo", "Rosa"],
    category: "Geral",
  },
  {
    id: "sizes-clothing",
    title: "Tamanhos de Vestuário",
    icon: Tag,
    options: ["PP", "P", "M", "G", "GG", "XG"],
    category: "Vestuário",
  },
  {
    id: "materials-footwear",
    title: "Materiais Principais",
    icon: Layers,
    options: ["Couro Legítimo", "Sintético Premium", "Camurça", "Lona", "Verniz", "Nylon"],
    category: "Calçados & Bolsas",
  },
  {
    id: "voltage-electronics",
    title: "Voltagem Elétrica",
    icon: SlidersHorizontal,
    options: ["110V", "220V", "Bivolt"],
    category: "Eletrônicos",
  },
];

function AtributosPage() {
  const types = Route.useLoaderData() as any[];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Custom Group Form State
  const [groupName, setGroupName] = useState("");
  const [groupSlug, setGroupSlug] = useState("");
  const [optionInput, setOptionInput] = useState("");
  const [optionsList, setOptionsList] = useState<string[]>([]);

  const handleAddOption = () => {
    if (!optionInput.trim()) return;
    if (optionsList.includes(optionInput.trim())) {
      toast.error("Esta opção já foi adicionada.");
      return;
    }
    setOptionsList([...optionsList, optionInput.trim()]);
    setOptionInput("");
  };

  const handleRemoveOption = (opt: string) => {
    setOptionsList(optionsList.filter((o) => o !== opt));
  };

  const handleImportPreset = async (preset: typeof PRESET_OPTION_GROUPS[0]) => {
    setIsSaving(true);
    try {
      const slug = preset.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-");

      await createProductType({
        data: {
          name: preset.title,
          slug,
          field_schema: [
            {
              name: preset.title,
              kind: "option_group",
              required: true,
              options: preset.options,
            },
          ],
        },
      });

      toast.success(`Grupo "${preset.title}" importado com sucesso!`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao importar preset.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (optionsList.length === 0) {
      toast.error("Adicione pelo menos uma opção ao grupo.");
      return;
    }

    setIsSaving(true);
    try {
      const slug = (groupSlug || groupName)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-");

      await createProductType({
        data: {
          name: groupName,
          slug,
          field_schema: [
            {
              name: groupName,
              kind: "option_group",
              required: true,
              options: optionsList,
            },
          ],
        },
      });

      toast.success("Grupo de opções criado!");
      setOpen(false);
      setGroupName("");
      setGroupSlug("");
      setOptionsList([]);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar grupo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catálogo / Atributos Globais"
        title="Grupos de Opções Reutilizáveis"
        description="Defina conjuntos padrão de tamanhos, cores e características para reutilizar em diferentes produtos com 1 clique."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" aria-hidden />
                Novo Grupo de Opções
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Grupo de Opções Customizado</DialogTitle>
                <DialogDescription>
                  Defina o nome do grupo (ex: Tamanhos Salto Alto) e adicione as opções.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitCustom} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="g-name">Nome do Grupo *</Label>
                  <Input
                    id="g-name"
                    placeholder="Ex: Tamanhos Tênis Esportivo"
                    value={groupName}
                    onChange={(e) => {
                      setGroupName(e.target.value);
                      setGroupSlug(
                        e.target.value
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]+/g, "-"),
                      );
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="g-slug">Slug Identificador</Label>
                  <Input
                    id="g-slug"
                    placeholder="tamanhos-tenis-esportivo"
                    value={groupSlug}
                    onChange={(e) => setGroupSlug(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Opções do Grupo (Adicione uma a uma)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: 35 ou Vermelho"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddOption}>
                      Adicionar
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 min-h-12 p-2 rounded-lg border bg-muted/30">
                    {optionsList.length === 0 ? (
                      <span className="text-xs text-muted-foreground self-center">
                        Nenhuma opção adicionada ainda.
                      </span>
                    ) : (
                      optionsList.map((opt) => (
                        <Badge key={opt} variant="secondary" className="text-xs flex items-center gap-1">
                          {opt}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(opt)}
                            className="hover:text-destructive text-muted-foreground ml-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Grupo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Seção 1: Presets Prontos (1-Click Import) */}
      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            Biblioteca de Presets de Variação (1-Clique)
          </CardTitle>
          <CardDescription>
            Importe conjuntos canônicos prontos para acelerar o cadastro dos seus produtos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {PRESET_OPTION_GROUPS.map((preset) => {
            const Icon = preset.icon;
            const isImported = types.some((t: any) => t.name === preset.title);

            return (
              <div
                key={preset.id}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {preset.category}
                    </span>
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{preset.title}</h4>
                  <div className="flex flex-wrap gap-1">
                    {preset.options.map((opt) => (
                      <Badge key={opt} variant="outline" className="text-[11px] py-0">
                        {opt}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  variant={isImported ? "secondary" : "outline"}
                  size="sm"
                  disabled={isImported || isSaving}
                  className="w-full text-xs"
                  onClick={() => handleImportPreset(preset)}
                >
                  {isImported ? (
                    <>
                      <CheckCircle2 className="size-3.5 mr-1 text-emerald-600" />
                      Grupo Ativo
                    </>
                  ) : (
                    "Importar Conjunto"
                  )}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Seção 2: Grupos de Opções Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grupos de Opções Ativos no Sistema</CardTitle>
          <CardDescription>
            Estes esquemas estão disponíveis para seleção dinâmica nos Tipos de Produto e no Editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
            <EmptyState
              title="Nenhum grupo ativo"
              description="Importe um preset acima ou crie um grupo personalizado."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {types.map((type: any) => {
                const schema = Array.isArray(type.field_schema) ? type.field_schema : [];
                const optionFields = schema.filter((f: any) => f.options && Array.isArray(f.options));

                return (
                  <div key={type.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{type.name}</h4>
                        <p className="text-xs text-muted-foreground font-mono">/{type.slug}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {optionFields.length > 0 ? `${optionFields.length} grupo(s)` : "Campos livres"}
                      </Badge>
                    </div>

                    {optionFields.map((f: any, idx: number) => (
                      <div key={idx} className="space-y-1 pt-1">
                        <span className="text-xs font-semibold text-muted-foreground">{f.name}:</span>
                        <div className="flex flex-wrap gap-1">
                          {f.options.map((opt: string) => (
                            <Badge key={opt} variant="outline" className="text-xs bg-muted/40">
                              {opt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, GripVertical, Plus, Trash2, Save } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdminPageDetails, savePageSections } from "@/services/cms.functions";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/cms/paginas/$id/editor")({
  head: () => ({ meta: [{ title: "Editor de Página — Hr Shoes" }] }),
  loader: async ({ params }) => {
    const res = await getAdminPageDetails({ data: { id: params.id } });
    if (res.status === "error") throw new Error(res.message);
    if (res.status === "unconfigured") throw new Error("Supabase não configurado");
    return res.data;
  },
  component: PageEditor,
});

type SectionType = "hero" | "text" | "product_grid" | "image" | "spacer";

interface SectionData {
  id?: string;
  section_type: SectionType;
  content: Record<string, unknown>;
  sort_order: number;
}

function PageEditor() {
  const page = Route.useLoaderData();
  const navigate = useNavigate();
  const [sections, setSections] = useState<SectionData[]>(
    page.sections.map(
      (s: {
        id: string;
        section_type: string;
        content: Record<string, unknown>;
        sort_order: number;
      }) => ({
        id: s.id,
        section_type: s.section_type as SectionType,
        content: s.content,
        sort_order: s.sort_order,
      }),
    ),
  );
  const [isSaving, setIsSaving] = useState(false);

  const addSection = () => {
    setSections([
      ...sections,
      {
        section_type: "text",
        content: { text: "Novo bloco de texto" },
        sort_order: sections.length,
      },
    ]);
  };

  const removeSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections.map((s, i) => ({ ...s, sort_order: i })));
  };

  const updateSection = (index: number, key: string, value: unknown) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [key]: value };
    setSections(newSections);
  };

  const updateSectionContent = (index: number, contentKey: string, value: unknown) => {
    const newSections = [...sections];
    newSections[index].content = { ...newSections[index].content, [contentKey]: value };
    setSections(newSections);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;
    setSections(newSections.map((s, i) => ({ ...s, sort_order: i })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await savePageSections({ data: { page_id: page.id, sections } });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Página salva com sucesso!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/admin/cms/paginas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader title={`Editando: ${page.title}`} description={`/${page.slug}`} />
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      <div className="max-w-3xl space-y-4">
        {sections.length === 0 ? (
          <EmptyState
            title="Nenhuma seção adicionada"
            description="Esta página ainda está em branco."
            action={
              <Button onClick={addSection}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeiro bloco
              </Button>
            }
          />
        ) : (
          sections.map((section, index) => (
            <Card key={index} className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center border-r bg-muted/50 rounded-l-md cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardContent className="pl-12 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de Bloco</Label>
                      <Select
                        value={section.section_type}
                        onValueChange={(v) => updateSection(index, "section_type", v)}
                      >
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hero">Hero Banner</SelectItem>
                          <SelectItem value="text">Texto Simples</SelectItem>
                          <SelectItem value="product_grid">Vitrine de Produtos</SelectItem>
                          <SelectItem value="image">Imagem</SelectItem>
                          <SelectItem value="spacer">Espaçamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {section.section_type === "text" && (
                      <div className="space-y-2">
                        <Label>Conteúdo do Texto</Label>
                        <Input
                          value={String(section.content.text || "")}
                          onChange={(e) => updateSectionContent(index, "text", e.target.value)}
                          placeholder="Digite o texto do bloco..."
                        />
                      </div>
                    )}

                    {section.section_type === "hero" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Título (Hero)</Label>
                          <Input
                            value={String(section.content.title || "")}
                            onChange={(e) => updateSectionContent(index, "title", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subtítulo</Label>
                          <Input
                            value={String(section.content.subtitle || "")}
                            onChange={(e) =>
                              updateSectionContent(index, "subtitle", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URL da Imagem de Fundo</Label>
                          <Input
                            value={String(section.content.bg_url || "")}
                            onChange={(e) => updateSectionContent(index, "bg_url", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      Subir
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => removeSection(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {sections.length > 0 && (
          <Button variant="outline" className="w-full" onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Novo Bloco
          </Button>
        )}
      </div>
    </div>
  );
}

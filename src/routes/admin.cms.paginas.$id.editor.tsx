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
import { listCollections } from "@/services/admin-catalog.functions";
import { EmptyState } from "@/components/state/states";
import { cmsRegistry, cmsBlocksList, type CmsFieldDef } from "@/lib/cms-registry";

export const Route = createFileRoute("/admin/cms/paginas/$id/editor")({
  head: () => ({ meta: [{ title: "Editor de Página — Hr Shoes" }] }),
  loader: async ({ params }) => {
    const [res, colRes] = await Promise.all([
      getAdminPageDetails({ data: { id: params.id } }),
      listCollections()
    ]);
    if (res.status === "error") throw new Error(res.message);
    if (res.status === "unconfigured") throw new Error("Supabase não configurado");
    return {
      page: res.data,
      collections: colRes.status === "ok" ? colRes.data : [],
    };
  },
  component: PageEditor,
});

interface SectionData {
  id?: string;
  section_type: string;
  content: Record<string, unknown>;
  sort_order: number;
}

function PageEditor() {
  const { page, collections } = Route.useLoaderData();
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
        section_type: s.section_type,
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
        section_type: cmsBlocksList[0].type,
        content: {},
        sort_order: sections.length,
      },
    ]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;
    setSections(newSections);
  };

  const updateSection = (index: number, key: string, value: string) => {
    const newSections = [...sections];
    if (key === "section_type") {
      newSections[index].section_type = value;
      newSections[index].content = {};
    }
    setSections(newSections);
  };

  const updateSectionContent = (index: number, key: string, value: unknown) => {
    const newSections = [...sections];
    newSections[index].content = {
      ...newSections[index].content,
      [key]: value,
    };
    setSections(newSections);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Reassign sort orders based on array position
      const payload = sections.map((s, i) => ({
        id: s.id,
        section_type: s.section_type,
        content: s.content,
        sort_order: i,
      }));

      const res = await savePageSections({ data: { pageId: page.id, sections: payload } });
      if (res.status === "error") throw new Error(res.message);

      toast.success("Página salva com sucesso");
      navigate({ to: "/admin/cms/paginas" });
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar página");
    } finally {
      setIsSaving(false);
    }
  };

  const renderDynamicField = (index: number, field: CmsFieldDef, section: SectionData) => {
    const value = String(section.content[field.name] || "");

    if (field.type === "text") {
      return (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          <Input
            value={value}
            onChange={(e) => updateSectionContent(index, field.name, e.target.value)}
            placeholder={`Digite ${field.label.toLowerCase()}...`}
          />
        </div>
      );
    }

    if (field.type === "image") {
      return (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          <Input
            type="url"
            value={value}
            onChange={(e) => updateSectionContent(index, field.name, e.target.value)}
            placeholder="https://..."
          />
        </div>
      );
    }

    if (field.type === "collection_select") {
      return (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          <Select
            value={value}
            onValueChange={(v) => updateSectionContent(index, field.name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a coleção..." />
            </SelectTrigger>
            <SelectContent>
              {collections.map((col: any) => (
                <SelectItem key={col.id} value={col.slug}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={field.name} className="space-y-2">
        <Label>{field.label}</Label>
        <Input
          value={value}
          onChange={(e) => updateSectionContent(index, field.name, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-4xl pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/cms/paginas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader title={`Editando: ${page.title}`} description={`Slug: /${page.slug}`} />
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Página"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {sections.length === 0 ? (
          <EmptyState
            title="Nenhum bloco"
            description="Esta página ainda não possui conteúdo."
            action={
              <Button onClick={addSection}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Bloco
              </Button>
            }
          />
        ) : (
          sections.map((section, index) => {
            const blockDef = cmsRegistry[section.section_type];
            return (
              <Card key={index} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-2 cursor-move text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label>Tipo de Bloco</Label>
                        <Select
                          value={section.section_type}
                          onValueChange={(v) => updateSection(index, "section_type", v)}
                        >
                          <SelectTrigger className="w-full sm:w-[250px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cmsBlocksList.map((block) => (
                              <SelectItem key={block.type} value={block.type}>
                                {block.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {blockDef?.fields.map((field) => renderDynamicField(index, field, section))}
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
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeSection(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
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

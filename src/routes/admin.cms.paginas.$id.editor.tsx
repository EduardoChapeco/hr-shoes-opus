import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  Smartphone,
  Monitor,
  Eye,
  Settings2
} from "lucide-react";

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
import { ImageUpload } from "@/components/ui/image-upload";

// Storefront components for live preview
import { AnnouncementBar as CMSAnnouncementBar } from "@/components/commerce/dynamic-sections/announcement-bar";
import { HeroCarousel } from "@/components/commerce/dynamic-sections/hero-carousel";
import { MosaicBanners } from "@/components/commerce/dynamic-sections/mosaic-banners";
import { ProductRail } from "@/components/commerce/dynamic-sections/product-rail";
import { RichText } from "@/components/commerce/dynamic-sections/rich-text";

// Mock products to allow rendering preview rails visually
const MOCK_PRODUCTS = [
  {
    id: "1",
    slug: "scarpin-nude",
    title: "Scarpin Nude Verniz",
    coverUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60",
    coverAlt: "Scarpin Nude Verniz",
    basePrice: 19990,
    currentPrice: 19990,
    hasDiscount: false,
    discountLabel: ""
  },
  {
    id: "2",
    slug: "sandalia-salto-bloco",
    title: "Sandália Salto Bloco Couro",
    coverUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=60",
    coverAlt: "Sandália Salto Bloco Couro",
    basePrice: 24990,
    currentPrice: 17990,
    hasDiscount: true,
    discountLabel: "28% OFF"
  },
  {
    id: "3",
    slug: "sapatilha-bico-fino",
    title: "Sapatilha Bico Fino Confort",
    coverUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&auto=format&fit=crop&q=60",
    coverAlt: "Sapatilha Bico Fino Confort",
    basePrice: 12990,
    currentPrice: 12990,
    hasDiscount: false,
    discountLabel: ""
  },
  {
    id: "4",
    slug: "mule-tassel-preto",
    title: "Mule Tassel Camurça Preto",
    coverUrl: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=500&auto=format&fit=crop&q=60",
    coverAlt: "Mule Tassel Camurça Preto",
    basePrice: 15990,
    currentPrice: 15990,
    hasDiscount: false,
    discountLabel: ""
  }
];

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
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("mobile");

  const addSection = () => {
    const newIdx = sections.length;
    setSections([
      ...sections,
      {
        section_type: cmsBlocksList[0].type,
        content: {},
        sort_order: newIdx,
      },
    ]);
    setActiveSectionIndex(newIdx);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
    if (activeSectionIndex === index) {
      setActiveSectionIndex(null);
    } else if (activeSectionIndex !== null && activeSectionIndex > index) {
      setActiveSectionIndex(activeSectionIndex - 1);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;
    setSections(newSections);
    if (activeSectionIndex === index) {
      setActiveSectionIndex(index - 1);
    } else if (activeSectionIndex === index - 1) {
      setActiveSectionIndex(index);
    }
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;
    setSections(newSections);
    if (activeSectionIndex === index) {
      setActiveSectionIndex(index + 1);
    } else if (activeSectionIndex === index + 1) {
      setActiveSectionIndex(index);
    }
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
    const rawValue = section.content[field.name];
    const value = rawValue !== undefined ? rawValue : (field.defaultValue ?? "");

    if (field.type === "array" && field.subFields) {
      const items = (Array.isArray(value) ? value : []) as any[];
      return (
        <div key={field.name} className="space-y-4 border p-4 rounded-md bg-muted/20">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">{field.label}</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newItems = [...items, {}];
                updateSectionContent(index, field.name, newItems);
              }}
            >
              <Plus className="size-4 mr-2" /> Adicionar
            </Button>
          </div>
          {items.map((item, itemIdx) => (
            <div key={itemIdx} className="relative space-y-4 border p-4 rounded bg-background shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  const newItems = items.filter((_, i) => i !== itemIdx);
                  updateSectionContent(index, field.name, newItems);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
              <div className="grid gap-4 md:grid-cols-1 pr-8">
                {field.subFields!.map((subField) => {
                  const subValue = item[subField.name] !== undefined ? item[subField.name] : (subField.defaultValue ?? "");
                  return (
                    <div key={subField.name} className="space-y-2">
                      <Label>{subField.label}</Label>
                      {subField.type === "image" ? (
                        <ImageUpload
                          value={String(subValue || "")}
                          onChange={(url) => {
                            const newItems = [...items];
                            newItems[itemIdx] = {
                              ...newItems[itemIdx],
                              [subField.name]: url,
                            };
                            updateSectionContent(index, field.name, newItems);
                          }}
                          onRemove={() => {
                            const newItems = [...items];
                            newItems[itemIdx] = {
                              ...newItems[itemIdx],
                              [subField.name]: "",
                            };
                            updateSectionContent(index, field.name, newItems);
                          }}
                          bucket="cms-media"
                        />
                      ) : (
                        <Input
                          type={subField.type === "color" ? "color" : subField.type === "number" ? "number" : "text"}
                          value={subValue}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[itemIdx] = {
                              ...newItems[itemIdx],
                              [subField.name]: subField.type === "number" ? Number(e.target.value) : e.target.value,
                            };
                            updateSectionContent(index, field.name, newItems);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (field.type === "enum" && field.options) {
      return (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          <Select
            value={String(value)}
            onValueChange={(v) => updateSectionContent(index, field.name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === "boolean") {
      const isChecked = Boolean(value === "true" || value === true);
      return (
        <div key={field.name} className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id={`chk-${index}-${field.name}`}
            checked={isChecked}
            onChange={(e) => updateSectionContent(index, field.name, e.target.checked)}
            className="size-4 rounded border-gray-300 accent-primary"
          />
          <Label htmlFor={`chk-${index}-${field.name}`}>{field.label}</Label>
        </div>
      );
    }

    if (field.type === "collection_select") {
      return (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          <Select
            value={String(value)}
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

    if (field.type === "image") {
      return (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          <ImageUpload
            value={String(value)}
            onChange={(url) => updateSectionContent(index, field.name, url)}
            onRemove={() => updateSectionContent(index, field.name, "")}
            bucket="cms-media"
          />
        </div>
      );
    }

    const inputType = field.type === "color" ? "color" : field.type === "number" ? "number" : "text";

    return (
      <div key={field.name} className="space-y-2">
        <Label>{field.label}</Label>
        <Input
          type={inputType}
          value={String(value)}
          onChange={(e) => {
            const val = field.type === "number" ? Number(e.target.value) : e.target.value;
            updateSectionContent(index, field.name, val);
          }}
        />
      </div>
    );
  };

  const renderPreviewSection = (section: SectionData, index: number) => {
    switch (section.section_type) {
      case "announcement_bar":
        return <CMSAnnouncementBar content={section.content} />;
      case "hero":
      case "hero_carousel":
        return <HeroCarousel content={section.content} />;
      case "rich_text":
      case "text":
        return <RichText content={section.content} />;
      case "featured_products":
      case "product_grid":
      case "product_rail":
        return <ProductRail content={section.content} publishedProducts={MOCK_PRODUCTS} />;
      case "mosaic_banners":
        return <MosaicBanners content={section.content} />;
      default:
        return (
          <div className="p-10 border border-dashed text-center rounded bg-slate-50 text-muted-foreground">
            Seção: {cmsRegistry[section.section_type]?.label || section.section_type}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 bg-background flex flex-col">
      {/* CMS Toolbar header */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-8">
            <Link to="/admin/cms/paginas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="font-semibold text-sm">Visual Builder: {page.title}</span>
          <span className="text-xs text-muted-foreground font-mono hidden sm:inline">/{page.slug}</span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center bg-muted rounded-lg p-0.5 text-muted-foreground gap-0.5">
          <Button
            variant={previewDevice === "mobile" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => setPreviewDevice("mobile")}
          >
            <Smartphone className="size-3.5" />
            Mobile
          </Button>
          <Button
            variant={previewDevice === "desktop" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => setPreviewDevice("desktop")}
          >
            <Monitor className="size-3.5" />
            Desktop
          </Button>
        </div>

        <div>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-9">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Editor Split-Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Realtime high-fidelity live preview */}
        <div className="flex-1 h-full overflow-y-auto bg-muted/30 p-6 flex justify-center items-start">
          <div className={`w-full transition-all duration-300 ${previewDevice === "mobile" ? "max-w-sm border-8 border-slate-900 rounded-[36px] shadow-2xl bg-background overflow-hidden min-h-[680px] my-4" : "max-w-screen-lg bg-background rounded-lg border shadow-md min-h-screen"}`}>
            
            {/* Device frame content wrapper */}
            <div className="relative w-full h-full flex flex-col gap-6 pb-20">
              
              {/* Simulated header inside iframe */}
              <div className="border-b px-4 py-3 flex items-center justify-between text-xs font-semibold select-none bg-background text-muted-foreground shrink-0 border-dashed">
                <span>Hr Shoes Vitrine</span>
                <span className="font-mono">preview mode</span>
              </div>

              {sections.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum bloco inserido. Adicione blocos para montar sua vitrine.
                </div>
              ) : (
                sections.map((section, index) => {
                  const isActive = activeSectionIndex === index;
                  return (
                    <div
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSectionIndex(index);
                      }}
                      className={`relative group border-2 transition-all ${isActive ? "border-primary ring-4 ring-primary/10" : "border-transparent hover:border-primary/40"} cursor-pointer`}
                    >
                      {/* Interactive Section Cover Details */}
                      <div className={`absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"}`}>
                        {cmsRegistry[section.section_type]?.label || section.section_type}
                      </div>

                      {/* Render Visual Section component */}
                      <div className="pointer-events-none select-none">
                        {renderPreviewSection(section, index)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Properties / Block Settings Sidebar */}
        <div className="w-[420px] shrink-0 border-l bg-card flex flex-col h-full overflow-hidden">
          
          {/* Sidebar Editor Toolbar */}
          <div className="h-12 border-b flex items-center justify-between px-4 bg-muted/10 shrink-0">
            {activeSectionIndex !== null ? (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setActiveSectionIndex(null)}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Editar Bloco #{activeSectionIndex + 1}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="size-7"
                  onClick={() => removeSection(activeSectionIndex)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estrutura do CMS
              </span>
            )}
          </div>

          {/* Sidebar dynamic fields form */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeSectionIndex !== null ? (
              // Active Section properties edit form
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Tipo de Bloco</Label>
                  <Select
                    value={sections[activeSectionIndex].section_type}
                    onValueChange={(v) => updateSection(activeSectionIndex, "section_type", v)}
                  >
                    <SelectTrigger>
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

                <div className="border-t pt-4 space-y-4">
                  {cmsRegistry[sections[activeSectionIndex].section_type]?.fields.map((field) =>
                    renderDynamicField(activeSectionIndex, field, sections[activeSectionIndex])
                  )}
                </div>

                <div className="border-t pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => setActiveSectionIndex(null)}
                  >
                    Voltar à lista
                  </Button>
                </div>
              </div>
            ) : (
              // General layout structure list view
              <div className="space-y-4">
                {sections.length === 0 ? (
                  <EmptyState
                    title="Nenhum bloco"
                    description="Adicione blocos para montar a página."
                    action={
                      <Button size="sm" onClick={addSection}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Bloco
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Selecione um bloco para editar ou use os botões para reordenar:
                    </p>
                    {sections.map((section, index) => {
                      const blockDef = cmsRegistry[section.section_type];
                      return (
                        <div
                          key={index}
                          onClick={() => setActiveSectionIndex(index)}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:border-primary/50 cursor-pointer group transition-all"
                        >
                          <GripVertical className="size-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-muted-foreground block">
                              Bloco #{index + 1}
                            </span>
                            <span className="font-medium text-sm text-foreground block truncate">
                              {blockDef?.label || section.section_type}
                            </span>
                          </div>
                          
                          {/* Reordering and deleting toolbar on row */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              disabled={index === 0}
                              onClick={() => moveUp(index)}
                            >
                              <ChevronUp className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              disabled={index === sections.length - 1}
                              onClick={() => moveDown(index)}
                            >
                              <ChevronDown className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:bg-destructive/10"
                              onClick={() => removeSection(index)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {sections.length > 0 && (
                  <Button variant="outline" className="w-full text-xs" onClick={addSection}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Novo Bloco
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


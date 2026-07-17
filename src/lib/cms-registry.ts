import { z } from "zod";

export type CmsFieldType =
  | "string"
  | "text"
  | "image"
  | "boolean"
  | "product_list"
  | "collection_select"
  | "array"
  | "enum"
  | "color"
  | "number";

export interface CmsFieldOption {
  label: string;
  value: string;
}

export interface CmsFieldDef {
  name: string;
  label: string;
  type: CmsFieldType;
  required?: boolean;
  options?: CmsFieldOption[]; // For enum types
  subFields?: CmsFieldDef[]; // For array types
  defaultValue?: any;
}

export interface CmsBlockDef {
  type: string;
  label: string;
  description?: string;
  fields: CmsFieldDef[];
  schema: z.ZodTypeAny;
}

export const cmsRegistry: Record<string, CmsBlockDef> = {
  hero_carousel: {
    type: "hero_carousel",
    label: "Carrossel de Banners (Hero)",
    description: "Múltiplos banners rotativos",
    fields: [
      { name: "autoPlay", label: "Rotação Automática", type: "boolean", defaultValue: true },
      { name: "interval", label: "Intervalo (segundos)", type: "number", defaultValue: 5 },
      {
        name: "banners",
        label: "Banners",
        type: "array",
        subFields: [
          { name: "title", label: "Título", type: "string" },
          { name: "image_url", label: "Imagem (Desktop)", type: "image", required: true },
          { name: "mobile_image_url", label: "Imagem (Mobile)", type: "image" },
          { name: "link", label: "Link de Destino", type: "string" },
          { name: "button_text", label: "Texto do Botão", type: "string" },
        ],
      },
    ],
    schema: z.object({
      autoPlay: z.boolean().optional(),
      interval: z.number().optional(),
      banners: z
        .array(
          z.object({
            title: z.string().optional(),
            image_url: z.string().url("URL inválida"),
            mobile_image_url: z.string().optional(),
            link: z.string().optional(),
            button_text: z.string().optional(),
          }),
        )
        .optional(),
    }),
  },
  announcement_bar: {
    type: "announcement_bar",
    label: "Barra de Avisos",
    description: "Barra superior com comunicados",
    fields: [
      { name: "text", label: "Texto do Aviso", type: "string", required: true },
      { name: "link", label: "Link (Opcional)", type: "string" },
      { name: "bg_color", label: "Cor de Fundo (Hex)", type: "color", defaultValue: "#000000" },
      { name: "text_color", label: "Cor do Texto (Hex)", type: "color", defaultValue: "#ffffff" },
    ],
    schema: z.object({
      text: z.string().min(1, "Obrigatório"),
      link: z.string().optional(),
      bg_color: z.string().optional(),
      text_color: z.string().optional(),
    }),
  },
  featured_products: {
    type: "featured_products",
    label: "Carrossel de Produtos",
    description: "Vitrine horizontal de produtos atrelada a uma coleção",
    fields: [
      { name: "title", label: "Título da Seção", type: "string", required: true },
      { name: "collection_slug", label: "Coleção", type: "collection_select" },
      {
        name: "layout",
        label: "Estilo",
        type: "enum",
        options: [
          { label: "Carrossel", value: "carousel" },
          { label: "Grid Fixa", value: "grid" },
        ],
        defaultValue: "carousel",
      },
    ],
    schema: z.object({
      title: z.string().min(1, "Obrigatório"),
      collection_slug: z.string().optional(),
      layout: z.enum(["carousel", "grid"]).optional(),
    }),
  },
  mosaic_banners: {
    type: "mosaic_banners",
    label: "Mosaico de Banners",
    description: "2 a 3 Banners promocionais lado a lado",
    fields: [
      {
        name: "banners",
        label: "Banners (Máx 3)",
        type: "array",
        subFields: [
          { name: "image_url", label: "Imagem", type: "image", required: true },
          { name: "link", label: "Link", type: "string" },
          { name: "title", label: "Título Sobreposto (Opcional)", type: "string" },
        ],
      },
    ],
    schema: z.object({
      banners: z
        .array(
          z.object({
            image_url: z.string().url("URL inválida"),
            link: z.string().optional(),
            title: z.string().optional(),
          }),
        )
        .max(3, "Máximo de 3 banners no mosaico")
        .optional(),
    }),
  },
  rich_text: {
    type: "rich_text",
    label: "Texto Livre (Rich Text)",
    fields: [{ name: "content", label: "Conteúdo", type: "text", required: true }],
    schema: z.object({
      content: z.string().min(1, "Obrigatório"),
    }),
  },
};

export const cmsBlocksList = Object.values(cmsRegistry);

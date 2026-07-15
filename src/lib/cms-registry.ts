import { z } from "zod";

export type CmsFieldType = "string" | "text" | "image" | "boolean" | "product_list" | "collection_select";

export interface CmsFieldDef {
  name: string;
  label: string;
  type: CmsFieldType;
  required?: boolean;
}

export interface CmsBlockDef {
  type: string;
  label: string;
  fields: CmsFieldDef[];
  schema: z.ZodTypeAny;
}

export const cmsRegistry: Record<string, CmsBlockDef> = {
  hero: {
    type: "hero",
    label: "Banner Principal (Hero)",
    fields: [
      { name: "title", label: "Título", type: "string", required: true },
      { name: "subtitle", label: "Subtítulo", type: "string" },
      { name: "image_url", label: "Imagem de Fundo", type: "image", required: true },
      { name: "button_text", label: "Texto do Botão", type: "string" },
      { name: "button_link", label: "Link do Botão", type: "string" },
    ],
    schema: z.object({
      title: z.string().min(1, "Obrigatório"),
      subtitle: z.string().optional(),
      image_url: z.string().url("URL de imagem inválida"),
      button_text: z.string().optional(),
      button_link: z.string().optional(),
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
  featured_products: {
    type: "featured_products",
    label: "Produtos em Destaque",
    fields: [
      { name: "title", label: "Título da Seção", type: "string", required: true },
      { name: "collection_slug", label: "Coleção", type: "collection_select" },
    ],
    schema: z.object({
      title: z.string().min(1, "Obrigatório"),
      collection_slug: z.string().optional(),
    }),
  },
};

export const cmsBlocksList = Object.values(cmsRegistry);

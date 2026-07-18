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
  bento_grid: {
    type: "bento_grid",
    label: "Grelha Bento (Bento Grid)",
    description: "Grid assimétrica responsiva de banners e destaques",
    fields: [
      { name: "title", label: "Título da Seção", type: "string" },
      {
        name: "items",
        label: "Itens do Bento (Recomendado: 4 ou 5)",
        type: "array",
        subFields: [
          { name: "title", label: "Título", type: "string" },
          { name: "subtitle", label: "Subtítulo (Opcional)", type: "string" },
          { name: "image_url", label: "Imagem de Fundo", type: "image", required: true },
          { name: "link", label: "Link de Destino", type: "string" },
          {
            name: "size",
            label: "Proporção",
            type: "enum",
            options: [
              { label: "Pequeno (1x1)", value: "small" },
              { label: "Largo (2x1)", value: "wide" },
              { label: "Alto (1x2)", value: "tall" },
              { label: "Grande (2x2)", value: "large" },
            ],
            defaultValue: "small",
          },
        ],
      },
    ],
    schema: z.object({
      title: z.string().optional(),
      items: z
        .array(
          z.object({
            title: z.string().optional(),
            subtitle: z.string().optional(),
            image_url: z.string().url("URL de imagem inválida"),
            link: z.string().optional(),
            size: z.enum(["small", "wide", "tall", "large"]).default("small"),
          }),
        )
        .optional(),
    }),
  },
  gallery_grid: {
    type: "gallery_grid",
    label: "Galeria de Fotos",
    description: "Grid ou Mosaico de imagens com zoom",
    fields: [
      { name: "title", label: "Título da Galeria", type: "string" },
      {
        name: "columns",
        label: "Colunas (Desktop)",
        type: "enum",
        options: [
          { label: "2 Colunas", value: "2" },
          { label: "3 Colunas", value: "3" },
          { label: "4 Colunas", value: "4" },
        ],
        defaultValue: "3",
      },
      { name: "gap", label: "Espaçamento (pixels)", type: "number", defaultValue: 16 },
      {
        name: "images",
        label: "Fotos",
        type: "array",
        subFields: [
          { name: "image_url", label: "Imagem", type: "image", required: true },
          { name: "link", label: "Link (Opcional)", type: "string" },
          { name: "caption", label: "Legenda (Hover)", type: "string" },
        ],
      },
    ],
    schema: z.object({
      title: z.string().optional(),
      columns: z.enum(["2", "3", "4"]).default("3"),
      gap: z.number().optional(),
      images: z
        .array(
          z.object({
            image_url: z.string().url("URL inválida"),
            link: z.string().optional(),
            caption: z.string().optional(),
          }),
        )
        .optional(),
    }),
  },
  info_cards: {
    type: "info_cards",
    label: "Cards de Informação/Destaque",
    description: "Grid de cartões com ícones de benefícios da loja",
    fields: [
      {
        name: "cards",
        label: "Cartões",
        type: "array",
        subFields: [
          {
            name: "icon",
            label: "Ícone",
            type: "enum",
            options: [
              { label: "Caminhão (Frete)", value: "truck" },
              { label: "Troca/Retorno", value: "rotate-ccw" },
              { label: "Escudo (Segurança)", value: "shield" },
              { label: "Cartão (Pagamento)", value: "credit-card" },
              { label: "Etiqueta (Preço)", value: "tag" },
              { label: "Estrela (Qualidade)", value: "star" },
            ],
            defaultValue: "truck",
          },
          { name: "title", label: "Título do Card", type: "string", required: true },
          { name: "description", label: "Descrição Curta", type: "string" },
        ],
      },
    ],
    schema: z.object({
      cards: z
        .array(
          z.object({
            icon: z.enum(["truck", "rotate-ccw", "shield", "credit-card", "tag", "star"]).default("truck"),
            title: z.string().min(1, "Obrigatório"),
            description: z.string().optional(),
          }),
        )
        .optional(),
    }),
  },
  social_grid: {
    type: "social_grid",
    label: "Grid de Redes Sociais",
    description: "Mosaico estético de fotos do Instagram",
    fields: [
      { name: "username", label: "Nome do Usuário (@instagram)", type: "string", required: true },
      { name: "title", label: "Título da Seção", type: "string", defaultValue: "Siga-nos no Instagram" },
      {
        name: "posts",
        label: "Fotos do Feed",
        type: "array",
        subFields: [
          { name: "image_url", label: "Foto do Post", type: "image", required: true },
          { name: "link", label: "Link do Post", type: "string" },
        ],
      },
    ],
    schema: z.object({
      username: z.string().min(1, "Obrigatório"),
      title: z.string().optional(),
      posts: z
        .array(
          z.object({
            image_url: z.string().url("URL inválida"),
            link: z.string().optional(),
          }),
        )
        .optional(),
    }),
  },
  contact_form: {
    type: "contact_form",
    label: "Formulário de Contato",
    description: "Campos de contato e mensagem para leads",
    fields: [
      { name: "title", label: "Título do Formulário", type: "string", defaultValue: "Fale Conosco" },
      { name: "subtitle", label: "Subtítulo explicativo", type: "string", defaultValue: "Envie sua mensagem que responderemos em breve!" },
      { name: "email_recipient", label: "E-mail de Destino", type: "string", required: true },
      { name: "submit_text", label: "Texto do Botão", type: "string", defaultValue: "Enviar Mensagem" },
      { name: "show_phone", label: "Exibir Campo de Telefone", type: "boolean", defaultValue: true },
    ],
    schema: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      email_recipient: z.string().email("E-mail inválido"),
      submit_text: z.string().optional(),
      show_phone: z.boolean().optional(),
    }),
  },
  video_section: {
    type: "video_section",
    label: "Vídeo de Destaque",
    description: "Vídeo incorporado do YouTube, Vimeo ou arquivo MP4",
    fields: [
      { name: "title", label: "Título do Vídeo (Opcional)", type: "string" },
      { name: "video_url", label: "Link do Vídeo (YouTube, Vimeo ou MP4)", type: "string", required: true },
      { name: "auto_play", label: "Reprodução Automática", type: "boolean", defaultValue: false },
      { name: "loop", label: "Repetição Infinita", type: "boolean", defaultValue: true },
    ],
    schema: z.object({
      title: z.string().optional(),
      video_url: z.string().min(1, "URL do vídeo é obrigatória"),
      auto_play: z.boolean().optional(),
      loop: z.boolean().optional(),
    }),
  },
};

export const cmsBlocksList = Object.values(cmsRegistry);

import { z } from "zod";
import type { BlockManifest } from "./builder-types";

export const builderRegistry: Record<string, BlockManifest> = {
  section: {
    type: "section",
    version: "1.0.0",
    name: "Seção (Full Width)",
    description: "Um bloco estrutural de largura total",
    category: "layout",
    icon: "Square",
    allowedBuilderProfiles: "all",
    allowedParentTypes: "none", // Sections must be root nodes
    allowedChildTypes: ["container"],
    
    contentSchema: z.object({}),
    styleSchema: z.object({
      backgroundColor: z.string().optional(),
      backgroundImage: z.string().url().optional(),
    }),
    
    inspector: {
      design: [
        { name: "backgroundColor", label: "Cor de Fundo", type: "color" },
        { name: "backgroundImage", label: "Imagem de Fundo", type: "image" }
      ]
    },
    
    defaultProps: {
      node_type: "section",
      block_type: "section",
      content: {},
      design_tokens: {},
      layout_rules: {},
    }
  },
  
  container: {
    type: "container",
    version: "1.0.0",
    name: "Container",
    description: "Um contêiner para alinhar elementos ao centro da tela com limite de largura",
    category: "layout",
    icon: "Maximize",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["section"],
    allowedChildTypes: ["composition", "element"],
    
    contentSchema: z.object({}),
    layoutSchema: z.object({
      maxWidth: z.enum(["sm", "md", "lg", "xl", "2xl", "full"]).default("xl"),
      paddingX: z.enum(["none", "sm", "md", "lg"]).default("md"),
      paddingY: z.enum(["none", "sm", "md", "lg", "xl", "2xl"]).default("xl"),
      display: z.enum(["block", "flex", "grid"]).default("flex"),
      flexDirection: z.enum(["row", "col"]).default("col"),
      gap: z.enum(["none", "sm", "md", "lg", "xl"]).default("md"),
    }),
    
    inspector: {
      layout: [
        { name: "maxWidth", label: "Largura Máxima", type: "select", options: [
          { label: "Pequeno", value: "sm" },
          { label: "Normal", value: "lg" },
          { label: "Largo", value: "xl" },
          { label: "Largura Total", value: "full" },
        ]},
        { name: "flexDirection", label: "Direção", type: "select", options: [
          { label: "Vertical", value: "col" },
          { label: "Horizontal", value: "row" },
        ]},
        { name: "gap", label: "Espaçamento Interno", type: "select", options: [
          { label: "Sem Espaçamento", value: "none" },
          { label: "Pequeno", value: "sm" },
          { label: "Médio", value: "md" },
          { label: "Grande", value: "lg" },
        ]}
      ]
    },
    
    defaultProps: {
      node_type: "container",
      block_type: "container",
      layout_rules: {
        maxWidth: "xl",
        display: "flex",
        flexDirection: "col",
        gap: "md",
        paddingX: "md",
        paddingY: "xl"
      },
    }
  },

  rich_text: {
    type: "rich_text",
    version: "1.0.0",
    name: "Texto Formatado",
    description: "Bloco de texto com suporte a HTML semântico e estilos mistos",
    category: "content",
    icon: "Type",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container", "composition"],
    allowedChildTypes: "none",
    
    contentSchema: z.object({
      html: z.string()
    }),
    
    inspector: {
      content: [
        { name: "html", label: "Conteúdo", type: "textarea" }
      ]
    },
    
    defaultProps: {
      node_type: "element",
      block_type: "rich_text",
      content: { html: "<p>Digite seu texto aqui...</p>" }
    }
  },
  
  hero_carousel: {
    type: "hero_carousel",
    version: "2.0.0",
    name: "Carrossel de Banners",
    description: "Banner rotativo com CTAs",
    category: "commerce",
    icon: "Images",
    allowedBuilderProfiles: ["storefront", "campaign"],
    allowedParentTypes: ["container"],
    allowedChildTypes: "none",
    
    contentSchema: z.object({
      autoPlay: z.boolean().default(true),
      interval: z.number().default(5),
      banners: z.array(z.object({
        title: z.string().optional(),
        image_url: z.string().url(),
        mobile_image_url: z.string().optional(),
        link: z.string().optional(),
        button_text: z.string().optional()
      }))
    }),
    
    inspector: {
      content: [
        { name: "autoPlay", label: "Autoplay", type: "boolean" },
        { name: "interval", label: "Intervalo (segundos)", type: "number" }
      ]
    },
    
    defaultProps: {
      node_type: "composition",
      block_type: "hero_carousel",
      content: { autoPlay: true, interval: 5, banners: [] }
    }
  },

  bento_grid: {
    type: "bento_grid",
    version: "1.0.0",
    name: "Bento Grid",
    description: "Grid assimétrico avançado para campanhas e categorias",
    category: "commerce",
    icon: "LayoutGrid",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      title: z.string().optional(),
      items: z.array(z.any())
    }),
    inspector: { content: [] },
    defaultProps: {
      node_type: "composition",
      block_type: "bento_grid",
      content: { items: [] }
    }
  },

  countdown_timer: {
    type: "countdown_timer",
    version: "1.0.0",
    name: "Cronômetro de Oferta",
    description: "Relógio regressivo para escassez e promoções",
    category: "marketing",
    icon: "Clock",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container", "section"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      title: z.string().optional(),
      target_date: z.string(),
      expired_message: z.string().optional()
    }),
    inspector: { content: [] },
    defaultProps: {
      node_type: "element",
      block_type: "countdown_timer",
      content: { target_date: new Date(Date.now() + 86400000).toISOString(), title: "Oferta Encerra em" }
    }
  },

  stories_ring: {
    type: "stories_ring",
    version: "1.0.0",
    name: "Stories (Bolhas)",
    description: "Bolhas estilo Instagram que abrem modal em tela cheia",
    category: "marketing",
    icon: "PlayCircle",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      stories: z.array(z.any())
    }),
    inspector: { content: [] },
    defaultProps: {
      node_type: "composition",
      block_type: "stories_ring",
      content: { stories: [] }
    }
  },

  trust_badges: {
    type: "trust_badges",
    version: "1.0.0",
    name: "Emblemas de Confiança",
    description: "Ícones de segurança, frete e garantia",
    category: "commerce",
    icon: "ShieldCheck",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      badges: z.array(z.any())
    }),
    inspector: { content: [] },
    defaultProps: {
      node_type: "composition",
      block_type: "trust_badges",
      content: { badges: [] }
    }
  }
};

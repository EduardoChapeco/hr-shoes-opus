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
        { name: "interval", label: "Intervalo (segundos)", type: "number" },
        { name: "banners", label: "Banners (Array)", type: "array", arrayFields: [
          { name: "image_url", label: "Imagem (Upload)", type: "image" },
          { name: "link", label: "Link do Banner", type: "text" },
          { name: "alt_text", label: "Texto Alt", type: "text" }
        ] }
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
    inspector: { 
      content: [
        { name: "title", label: "Título do Bento Grid", type: "text" },
        { name: "items", label: "Itens do Grid", type: "array", arrayFields: [
          { name: "title", label: "Título do Item", type: "text" },
          { name: "description", label: "Descrição", type: "textarea" },
          { name: "image", label: "Imagem (Upload)", type: "image" },
          { name: "link", label: "Link de Destino", type: "text" },
          { name: "col_span", label: "Colunas ocupadas (1-3)", type: "number" }
        ] }
      ]
    },
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
    inspector: { 
      content: [
        { name: "title", label: "Título", type: "text" },
        { name: "target_date", label: "Data Alvo (ISO)", type: "text" },
        { name: "expired_message", label: "Mensagem Expirado", type: "text" }
      ]
    },
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
    inspector: { 
      content: [
        { name: "stories", label: "Histórias", type: "array", arrayFields: [
          { name: "title", label: "Título da Bolha", type: "text" },
          { name: "thumb", label: "Thumbnail", type: "image" },
          { name: "media_url", label: "Mídia Completa (Vídeo/Img)", type: "image" },
          { name: "link", label: "Link Produto", type: "text" }
        ] }
      ]
    },
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
    inspector: { 
      content: [
        { name: "badges", label: "Emblemas", type: "array", arrayFields: [
          { name: "icon", label: "Ícone SVG ou Imagem", type: "image" },
          { name: "title", label: "Título do Emblema", type: "text" },
          { name: "subtitle", label: "Subtítulo (Opcional)", type: "text" }
        ] }
      ]
    },
    defaultProps: {
      node_type: "composition",
      block_type: "trust_badges",
      content: { badges: [] }
    }
  },

  product_rail: {
    type: "product_rail",
    version: "1.0.0",
    name: "Vitrine de Produtos (Rail)",
    description: "Carrossel ou Grid de produtos baseado em uma fonte de dados",
    category: "commerce",
    icon: "ShoppingBag",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container", "section"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      title: z.string().optional(),
      layout: z.enum(["carousel", "grid"]).default("carousel"),
      collection_slug: z.string().optional()
    }),
    inspector: { 
      content: [
        { name: "title", label: "Título da Vitrine", type: "text" },
        { name: "collection_slug", label: "Slug da Coleção (opcional para botão Ver Tudo)", type: "text" },
      ],
      layout: [
        { name: "layout", label: "Layout de Exibição", type: "select", options: [
          { label: "Carrossel", value: "carousel" },
          { label: "Grid", value: "grid" }
        ]}
      ]
    },
    defaultProps: {
      node_type: "composition",
      block_type: "product_rail",
      content: { title: "Destaques", layout: "carousel" },
      data_bindings: { type: "latest_products" }
    }
  },

  announcement_bar: {
    type: "announcement_bar",
    version: "1.0.0",
    name: "Barra de Anúncio",
    description: "Faixa horizontal para avisos globais no topo da página",
    category: "marketing",
    icon: "Megaphone",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["section"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      text: z.string(),
      link: z.string().optional(),
      bg_color: z.string().optional(),
      text_color: z.string().optional(),
    }),
    inspector: { 
      content: [
        { name: "text", label: "Texto do Anúncio", type: "text" },
        { name: "link", label: "Link (Opcional)", type: "text" }
      ],
      design: [
        { name: "bg_color", label: "Cor de Fundo", type: "color" },
        { name: "text_color", label: "Cor do Texto", type: "color" }
      ]
    },
    defaultProps: {
      node_type: "element",
      block_type: "announcement_bar",
      content: { text: "Frete grátis para todo o Brasil acima de R$ 299", bg_color: "#000000", text_color: "#ffffff" }
    }
  },

  video_section: {
    type: "video_section",
    version: "1.0.0",
    name: "Vídeo",
    description: "Embed de vídeo do YouTube, Vimeo ou arquivo MP4",
    category: "content",
    icon: "Video",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container", "section"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      title: z.string().optional(),
      video_url: z.string().url(),
      auto_play: z.boolean().default(false),
      loop: z.boolean().default(true)
    }),
    inspector: { 
      content: [
        { name: "title", label: "Título do Vídeo", type: "text" },
        { name: "video_url", label: "URL do Vídeo (YouTube/Vimeo/MP4)", type: "text" },
        { name: "auto_play", label: "Reprodução Automática", type: "boolean" },
        { name: "loop", label: "Repetir Vídeo", type: "boolean" }
      ]
    },
    defaultProps: {
      node_type: "element",
      block_type: "video_section",
      content: { video_url: "", auto_play: false, loop: true }
    }
  },

  contact_form: {
    type: "contact_form",
    version: "1.0.0",
    name: "Formulário de Contato",
    description: "Formulário simples com campos de nome, email e mensagem",
    category: "marketing",
    icon: "Mail",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      email_to: z.string().email()
    }),
    inspector: { 
      content: [
        { name: "title", label: "Título", type: "text" },
        { name: "subtitle", label: "Subtítulo", type: "textarea" },
        { name: "email_to", label: "E-mail de Destino", type: "text" }
      ]
    },
    defaultProps: {
      node_type: "element",
      block_type: "contact_form",
      content: { title: "Fale Conosco", email_to: "contato@loja.com.br" }
    }
  },

  gallery_grid: {
    type: "gallery_grid",
    version: "1.0.0",
    name: "Grade de Imagens",
    description: "Grid responsivo de imagens (Estilo Instagram ou Portfólio)",
    category: "content",
    icon: "Image",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container", "section"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      title: z.string().optional(),
      images: z.array(z.any())
    }),
    inspector: { 
      content: [
        { name: "title", label: "Título da Galeria", type: "text" },
        { name: "images", label: "Imagens", type: "array", arrayFields: [
          { name: "url", label: "Upload da Imagem", type: "image" },
          { name: "alt", label: "Texto Alternativo", type: "text" }
        ] }
      ]
    },
    defaultProps: {
      node_type: "composition",
      block_type: "gallery_grid",
      content: { title: "Nossa Galeria", images: [] }
    }
  },

  info_cards: {
    type: "info_cards",
    version: "1.0.0",
    name: "Cartões de Informação",
    description: "Cards com ícone, título e texto",
    category: "marketing",
    icon: "CreditCard",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      cards: z.array(z.any())
    }),
    inspector: { 
      content: [
        { name: "cards", label: "Cartões", type: "array", arrayFields: [
          { name: "title", label: "Título do Cartão", type: "text" },
          { name: "description", label: "Texto", type: "textarea" },
          { name: "icon", label: "Ícone (Imagem)", type: "image" }
        ] }
      ]
    },
    defaultProps: {
      node_type: "composition",
      block_type: "info_cards",
      content: { cards: [] }
    }
  },

  mosaic_banners: {
    type: "mosaic_banners",
    version: "1.0.0",
    name: "Mosaico de Banners",
    description: "Banners em formato mosaico",
    category: "marketing",
    icon: "LayoutTemplate",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container", "section"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      banners: z.array(z.any())
    }),
    inspector: { 
      content: [
        { name: "banners", label: "Banners (Mosaico)", type: "array", arrayFields: [
          { name: "image_url", label: "Upload da Imagem", type: "image" },
          { name: "link", label: "Link de Ação", type: "text" },
          { name: "title", label: "Texto de Overlay", type: "text" }
        ] }
      ]
    },
    defaultProps: {
      node_type: "composition",
      block_type: "mosaic_banners",
      content: { banners: [] }
    }
  },

  social_grid: {
    type: "social_grid",
    version: "1.0.0",
    name: "Feed Social (Instagram)",
    description: "Mosaico de fotos das redes sociais",
    category: "marketing",
    icon: "Instagram",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      title: z.string().optional(),
      handle: z.string().optional(),
      images: z.array(z.any())
    }),
    inspector: { 
      content: [
        { name: "title", label: "Título do Feed", type: "text" },
        { name: "handle", label: "Usuário (@)", type: "text" },
        { name: "images", label: "Posts do Feed", type: "array", arrayFields: [
          { name: "url", label: "Imagem do Post", type: "image" },
          { name: "link", label: "Link para o Instagram", type: "text" }
        ] }
      ]
    },
    defaultProps: {
      node_type: "composition",
      block_type: "social_grid",
      content: { title: "Siga-nos", handle: "@lojahrshoes", images: [] }
    }
  },

  faq_accordion: {
    type: "faq_accordion",
    version: "1.0.0",
    name: "Perguntas Frequentes",
    description: "Lista de perguntas expansíveis",
    category: "marketing",
    icon: "HelpCircle",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      faqs: z.array(z.any())
    }),
    inspector: { 
      content: [
        { name: "title", label: "Título do FAQ", type: "text" },
        { name: "description", label: "Descrição Curta", type: "textarea" },
        { name: "faqs", label: "Perguntas", type: "array", arrayFields: [
          { name: "question", label: "Pergunta", type: "text" },
          { name: "answer", label: "Resposta", type: "textarea" }
        ] }
      ]
    },
    defaultProps: {
      node_type: "composition",
      block_type: "faq_accordion",
      content: { title: "Dúvidas Comuns", faqs: [] }
    }
  },

  testimonial_carousel: {
    type: "testimonial_carousel",
    version: "1.0.0",
    name: "Depoimentos de Clientes",
    description: "Carrossel de avaliações e provas sociais",
    category: "marketing",
    icon: "Star",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container", "section"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      testimonials: z.array(z.any())
    }),
    inspector: { 
      content: [
        { name: "title", label: "Título", type: "text" },
        { name: "subtitle", label: "Subtítulo", type: "textarea" },
        { name: "testimonials", label: "Depoimentos", type: "array", arrayFields: [
          { name: "author", label: "Nome do Cliente", type: "text" },
          { name: "content", label: "O que disse?", type: "textarea" },
          { name: "rating", label: "Nota (1-5)", type: "number" },
          { name: "avatar_url", label: "Foto do Cliente (Opcional)", type: "image" }
        ] }
      ]
    },
    defaultProps: {
      node_type: "composition",
      block_type: "testimonial_carousel",
      content: { title: "O que dizem nossos clientes", testimonials: [] }
    }
  },

  timeline_history: {
    type: "timeline_history",
    version: "1.0.0",
    name: "Timeline (História)",
    description: "Linha do tempo vertical para marcos da marca",
    category: "marketing",
    icon: "Clock",
    allowedBuilderProfiles: "all",
    allowedParentTypes: ["container", "section"],
    allowedChildTypes: "none",
    contentSchema: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      events: z.array(z.any())
    }),
    inspector: { 
      content: [
        { name: "title", label: "Título", type: "text" },
        { name: "subtitle", label: "Subtítulo", type: "textarea" },
        { name: "events", label: "Marcos Históricos", type: "array", arrayFields: [
          { name: "year", label: "Ano ou Data", type: "text" },
          { name: "title", label: "Título do Marco", type: "text" },
          { name: "description", label: "Descrição Histórica", type: "textarea" },
          { name: "image_url", label: "Foto Histórica (Upload)", type: "image" }
        ] }
      ]
    },
    defaultProps: {
      node_type: "composition",
      block_type: "timeline_history",
      content: { title: "Nossa História", events: [] }
    }
  }
};

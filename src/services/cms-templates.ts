import { randomUUID } from "crypto";

export const getTemplateSeedNodes = (templateId: string) => {
  const sectionId = randomUUID();
  const containerId = randomUUID();

  if (templateId === "biolink_classic") {
    return [
      {
        id: sectionId,
        node_type: "section",
        block_type: "section",
        parent_id: null,
        sort_order: 0,
        design_tokens: { backgroundColor: "#f8fafc" },
      },
      {
        id: containerId,
        node_type: "container",
        block_type: "container",
        parent_id: sectionId,
        sort_order: 0,
        layout_rules: { maxWidth: "sm", display: "flex", flexDirection: "col", gap: "md", paddingX: "md", paddingY: "xl" },
      },
      {
        id: randomUUID(),
        node_type: "element",
        block_type: "rich_text",
        parent_id: containerId,
        sort_order: 0,
        content: { html: "<div style='text-align:center'><img src='https://github.com/shadcn.png' style='width:96px;height:96px;border-radius:50%;margin:0 auto;'/><h3>Minha Loja</h3><p>Moda e Acessórios incríveis</p></div>" },
      },
      {
        id: randomUUID(),
        node_type: "composition",
        block_type: "social_grid",
        parent_id: containerId,
        sort_order: 1,
        content: { items: [
          { title: "Comprar Agora", link: "/", icon: "ShoppingBag" },
          { title: "WhatsApp", link: "https://wa.me", icon: "Smartphone" }
        ]}
      }
    ];
  }

  if (templateId === "landing_page") {
    return [
      {
        id: sectionId,
        node_type: "section",
        block_type: "section",
        parent_id: null,
        sort_order: 0,
      },
      {
        id: containerId,
        node_type: "container",
        block_type: "container",
        parent_id: sectionId,
        sort_order: 0,
        layout_rules: { maxWidth: "xl", display: "flex", flexDirection: "col", gap: "lg", paddingX: "md", paddingY: "lg" },
      },
      {
        id: randomUUID(),
        node_type: "composition",
        block_type: "hero_carousel",
        parent_id: containerId,
        sort_order: 0,
        content: { autoPlay: true, interval: 5, banners: [{ image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" }] }
      },
      {
        id: randomUUID(),
        node_type: "element",
        block_type: "countdown_timer",
        parent_id: containerId,
        sort_order: 1,
        content: { target_date: new Date(Date.now() + 86400000).toISOString(), title: "Oferta Encerra em" }
      },
      {
        id: randomUUID(),
        node_type: "composition",
        block_type: "product_carousel",
        parent_id: containerId,
        sort_order: 2,
        content: { title: "Destaques da Coleção", subtitle: "As melhores ofertas pra você" },
        data_bindings: { source: "dynamic_products" }
      },
      {
        id: randomUUID(),
        node_type: "composition",
        block_type: "product_grid",
        parent_id: containerId,
        sort_order: 3,
        content: { title: "Mais Vendidos", subtitle: "Aproveite antes que acabe" },
        data_bindings: { source: "dynamic_products" }
      }
    ];
  }

  if (templateId === "homepage_classic") {
    return [
      {
        id: sectionId,
        node_type: "section",
        block_type: "section",
        parent_id: null,
        sort_order: 0,
      },
      {
        id: containerId,
        node_type: "container",
        block_type: "container",
        parent_id: sectionId,
        sort_order: 0,
        layout_rules: { maxWidth: "full", display: "flex", flexDirection: "col", gap: "none", paddingX: "none", paddingY: "none" },
      },
      {
        id: randomUUID(),
        node_type: "composition",
        block_type: "hero_carousel",
        parent_id: containerId,
        sort_order: 0,
        content: { autoPlay: true, interval: 5, banners: [{ image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b" }] }
      },
      {
        id: randomUUID(),
        node_type: "composition",
        block_type: "product_carousel",
        parent_id: containerId,
        sort_order: 1,
        content: { title: "Produtos em Destaque", subtitle: "As últimas novidades da coleção" },
        data_bindings: { source: "dynamic_products" }
      },
      {
        id: randomUUID(),
        node_type: "composition",
        block_type: "bento_grid",
        parent_id: containerId,
        sort_order: 2,
        content: { items: [{ title: "Verão", image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446", col_span: 2 }] }
      }
    ];
  }

  if (templateId === "institutional_profile") {
    return [
      {
        id: sectionId,
        node_type: "section",
        block_type: "section",
        parent_id: null,
        sort_order: 0,
        design_tokens: { backgroundColor: "#ffffff" },
      },
      {
        id: containerId,
        node_type: "container",
        block_type: "container",
        parent_id: sectionId,
        sort_order: 0,
        layout_rules: { maxWidth: "lg", display: "flex", flexDirection: "col", gap: "xl", paddingX: "xl", paddingY: "2xl" },
      },
      {
        id: randomUUID(),
        node_type: "element",
        block_type: "rich_text",
        parent_id: containerId,
        sort_order: 0,
        content: { html: "<div style='text-align:center'><h1>Sobre Nossa Empresa</h1><p class='text-lg text-muted-foreground mt-4'>Conheça a história e os valores que nos movem todos os dias.</p></div>" },
      },
      {
        id: randomUUID(),
        node_type: "element",
        block_type: "image",
        parent_id: containerId,
        sort_order: 1,
        content: { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c", alt: "Nossa Equipe" }
      }
    ];
  }

  return [];
};

export const defaultHomeTemplate = {
  document_type: "home",
  title: "Página Inicial (Vitrine Padrão)",
  slug: "home",
  tree: [
    {
      type: "section",
      id: "hero-1",
      children: [
        {
          type: "hero",
          id: "hero-content-1",
          props: {
            title: "Lançamentos de Verão & Conforto",
            subtitle: "Descubra a nova coleção com frete grátis para todo o Brasil nas compras acima de R$299.",
            alignment: "center",
            backgroundImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop",
            primaryButtonText: "Ver Coleção",
            primaryButtonLink: "/catalogo",
          }
        }
      ]
    },
    {
      type: "section",
      id: "categories-1",
      props: {
        title: "Nossas Categorias",
        container: "container"
      },
      children: [
        {
          type: "grid",
          id: "cat-grid-1",
          props: { columns: 4, gap: "md" },
          children: [
            { type: "image_card", id: "cat-card-1", props: { title: "Tênis", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop", link: "/categoria/tenis" } },
            { type: "image_card", id: "cat-card-2", props: { title: "Saltos", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&auto=format&fit=crop", link: "/categoria/saltos" } },
            { type: "image_card", id: "cat-card-3", props: { title: "Rasteiras", image: "https://images.unsplash.com/photo-1603487742131-4160ec999306?q=80&w=800&auto=format&fit=crop", link: "/categoria/rasteiras" } },
            { type: "image_card", id: "cat-card-4", props: { title: "Bolsas", image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop", link: "/categoria/bolsas" } },
          ]
        }
      ]
    },
    {
      type: "section",
      id: "products-1",
      props: {
        title: "Destaques da Semana",
        container: "container"
      },
      children: [
        {
          type: "product_list",
          id: "prod-list-1",
          data_bindings: {
            source: "latest_products",
            limit: 4
          }
        }
      ]
    },
    {
      type: "section",
      id: "banner-2",
      children: [
        {
          type: "banner",
          id: "promo-banner-1",
          props: {
            title: "Ganhe 10% OFF na Primeira Compra!",
            subtitle: "Use o cupom BEMVINDA no carrinho.",
            backgroundColor: "#f5f5f5",
            textColor: "#000000"
          }
        }
      ]
    }
  ]
};

export const defaultBiolinkTemplate = {
  document_type: "biolink",
  title: "Link da Bio (Instagram/TikTok)",
  slug: "link-da-bio",
  tree: [
    {
      type: "biolink_header",
      id: "bio-header",
      data_bindings: { source: "store_profile" }
    },
    {
      type: "biolink_links",
      id: "bio-links",
      props: {
        links: [
          { title: "Comprar Agora (Catálogo)", url: "/catalogo", icon: "shopping-bag" },
          { title: "Falar com Vendedora", url: "https://wa.me/5511999999999", icon: "whatsapp" },
          { title: "Lançamentos Mês da Mulher", url: "/colecao/lancamentos", icon: "star" }
        ]
      }
    }
  ]
};

export const defaultFaqTemplate = {
  document_type: "institutional",
  title: "Dúvidas Frequentes (FAQ)",
  slug: "faq",
  tree: [
    {
      type: "section",
      id: "faq-section",
      props: { title: "Perguntas Frequentes", container: "container_narrow" },
      children: [
        {
          type: "accordion",
          id: "faq-acc",
          props: {
            items: [
              { title: "Qual o prazo de entrega?", content: "O prazo varia de acordo com a sua região. Geralmente despachamos em até 24h úteis após a confirmação do pagamento." },
              { title: "Posso trocar se não servir?", content: "Sim! Você tem até 7 dias corridos após o recebimento para solicitar a primeira troca grátis." },
              { title: "Quais as formas de pagamento?", content: "Aceitamos Pix (com 5% de desconto) e cartão de crédito em até 6x sem juros." }
            ]
          }
        }
      ]
    }
  ]
};

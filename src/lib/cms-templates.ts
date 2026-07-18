export interface TemplateSection {
  section_type: string;
  content: Record<string, any>;
}

export interface CmsTemplate {
  name: string;
  description: string;
  sections: TemplateSection[];
}

export const cmsTemplates: Record<string, CmsTemplate> = {
  lojinha_instagram: {
    name: "Lojinha Instagram (Vitrine)",
    description: "Ideal para e-commerce integrado ao feed e vendas sociais",
    sections: [
      {
        section_type: "announcement_bar",
        content: {
          text: "⚡ COMPRE AGORA: Frete grátis para todo o Brasil em compras acima de R$ 199,00!",
          bg_color: "#1e1b4b",
          text_color: "#ffffff",
        },
      },
      {
        section_type: "hero_carousel",
        content: {
          autoPlay: true,
          interval: 5,
          banners: [
            {
              title: "Lançamento Exclusivo Outono/Inverno",
              image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200",
              button_text: "Conhecer Coleção",
              link: "/produtos",
            },
          ],
        },
      },
      {
        section_type: "featured_products",
        content: {
          title: "Mais Curtidos e Vendidos no Feed",
          layout: "carousel",
        },
      },
      {
        section_type: "social_grid",
        content: {
          username: "hrshoes_oficial",
          title: "Siga nosso estilo no Instagram!",
          posts: [
            { image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300", link: "https://instagram.com" },
            { image_url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=300", link: "https://instagram.com" },
            { image_url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=300", link: "https://instagram.com" },
            { image_url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=300", link: "https://instagram.com" },
            { image_url: "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=300", link: "https://instagram.com" },
            { image_url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=300", link: "https://instagram.com" },
          ],
        },
      },
    ],
  },
  hopp_linktree_bento: {
    name: "Hopp/Linktree Bento (Perfil)",
    description: "Layout agregador de links, vídeos e formulários no estilo Bento Grid",
    sections: [
      {
        section_type: "bento_grid",
        content: {
          title: "Explorar Nossos Destaques",
          items: [
            {
              title: "Coleção de Tênis Urbanos",
              subtitle: "Conforto e Estilo",
              image_url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=400",
              size: "wide",
              link: "/produtos",
            },
            {
              title: "Fale com Consultor",
              subtitle: "Ajuda via WhatsApp",
              image_url: "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?q=80&w=400",
              size: "small",
              link: "https://wa.me/5549999999999",
            },
            {
              title: "Visite Nosso Canal",
              subtitle: "YouTube",
              image_url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=400",
              size: "small",
              link: "https://youtube.com",
            },
          ],
        },
      },
      {
        section_type: "info_cards",
        content: {
          cards: [
            {
              title: "Entrega Garantida",
              description: "Enviamos para todo o país com rastreamento",
              icon: "truck",
            },
            {
              title: "Troca Sem Burocracia",
              description: "Até 30 dias para efetuar a devolução grátis",
              icon: "rotate-ccw",
            },
          ],
        },
      },
      {
        section_type: "video_section",
        content: {
          title: "Assista ao Nosso Manifesto de Marca",
          video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          auto_play: false,
          loop: true,
        },
      },
      {
        section_type: "contact_form",
        content: {
          title: "Agende sua Consulta / Tire Dúvidas",
          subtitle: "Preencha os dados abaixo e entraremos em contato comercial",
          email_recipient: "comercial@hrshoes.com.br",
          submit_text: "Enviar Solicitação",
          show_phone: true,
        },
      },
    ],
  },
  google_meu_negocio: {
    name: "Perfil Google Meu Negócio (Perfil)",
    description: "Foco em atração física, agendamentos, mapa e canais de contato",
    sections: [
      {
        section_type: "info_cards",
        content: {
          cards: [
            {
              title: "Venha nos Visitar",
              description: "Rua do E-Commerce, 100 - Centro",
              icon: "star",
            },
            {
              title: "Agendamento VIP",
              description: "Horário exclusivo com provador reservado",
              icon: "shield",
            },
          ],
        },
      },
      {
        section_type: "contact_form",
        content: {
          title: "Preencha para Agendar sua Visita",
          subtitle: "Insira seu contato que validaremos os horários disponíveis",
          email_recipient: "agendas@hrshoes.com.br",
          submit_text: "Agendar Horário",
          show_phone: true,
        },
      },
    ],
  },
};

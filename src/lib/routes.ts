/**
 * Typed route registry — Hr Shoes Commerce.
 * Programmatic single source of truth for navigation, permissions and phase
 * gating. MUST stay in sync with docs/ROUTES.md.
 *
 * Nothing here fetches or renders — it only describes routes so navigation,
 * gates and tests can rely on one canonical list.
 */

import type { Audience, Phase, Role } from "@/types/domain";

export interface RouteEntry {
  /** URL pattern (TanStack-style params use $, docs use :). */
  path: string;
  /** Human label (pt-BR) for menus/breadcrumbs. */
  label: string;
  description: string;
  audience: Audience;
  /** Roles allowed. `visitor` means publicly accessible. */
  roles: Role[];
  phase: Phase;
  /** Whether the path contains dynamic params. */
  dynamic?: boolean;
  /**
   * Sidebar navigation group label (admin only).
   * When set, the route appears in the admin sidebar under this group.
   * Omit for routes that should not appear in the sidebar.
   */
  navGroup?: string;
  /**
   * Lucide icon name string (resolved to LucideIcon in the shell).
   * Keep as string here to avoid coupling this module to React.
   */
  navIcon?: string;
  /** If true, badge "Em breve" next to the nav label. */
  navPlanned?: boolean;
}

/** Convert docs-style ":param" to TanStack "$param". */
export function toTanstackPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, "$$$1");
}

export const PUBLIC_ROUTES: RouteEntry[] = [
  {
    path: "/",
    label: "Início",
    description: "Vitrine principal da loja",
    audience: "public",
    roles: ["visitor"],
    phase: 0,
    },
  {
    path: "/buscar",
    label: "Buscar",
    description: "Busca de produtos",
    audience: "public",
    roles: ["visitor"],
    phase: 1,
    },
  {
    path: "/catalogo",
    label: "Catálogo",
    description: "Todos os produtos",
    audience: "public",
    roles: ["visitor"],
    phase: 1,
    },
  {
    path: "/categoria/:slug",
    label: "Categoria",
    description: "Produtos por categoria",
    audience: "public",
    roles: ["visitor"],
    phase: 1,
      dynamic: true,
  },
  {
    path: "/colecao/:slug",
    label: "Coleção",
    description: "Produtos por coleção",
    audience: "public",
    roles: ["visitor"],
    phase: 1,
      dynamic: true,
  },
  {
    path: "/produto/:slug",
    label: "Produto",
    description: "Página de produto",
    audience: "public",
    roles: ["visitor"],
    phase: 1,
      dynamic: true,
  },
  {
    path: "/promocoes",
    label: "Promoções",
    description: "Ofertas ativas",
    audience: "public",
    roles: ["visitor"],
    phase: 1,
    },
  {
    path: "/stories",
    label: "Stories",
    description: "Conteúdo em stories",
    audience: "public",
    roles: ["visitor"],
    phase: 3,
    },
  {
    path: "/destaques/:slug",
    label: "Destaque",
    description: "Destaque permanente",
    audience: "public",
    roles: ["visitor"],
    phase: 3,
      dynamic: true,
  },
  {
    path: "/perfil-da-loja",
    label: "Perfil da loja",
    description: "Portfólio público da loja",
    audience: "public",
    roles: ["visitor"],
    phase: 3,
    },
  {
    path: "/links",
    label: "Links",
    description: "Link da bio",
    audience: "public",
    roles: ["visitor"],
    phase: 3,
    },
  {
    path: "/faq",
    label: "Perguntas frequentes",
    description: "Dúvidas comuns",
    audience: "public",
    roles: ["visitor"],
    phase: 3,
    },
  {
    path: "/contato",
    label: "Contato",
    description: "Fale com a loja",
    audience: "public",
    roles: ["visitor"],
    phase: 0,
    },
  {
    path: "/carrinho",
    label: "Carrinho",
    description: "Itens no carrinho",
    audience: "public",
    roles: ["visitor"],
    phase: 2,
    },
  {
    path: "/checkout",
    label: "Finalizar Compra",
    description: "Checkout: finalização",
    audience: "public",
    roles: ["visitor", "customer"],
    phase: 2,
  },





  {
    path: "/pedido/:publicToken/confirmacao",
    label: "Confirmação",
    description: "Confirmação do pedido",
    audience: "public",
    roles: ["visitor"],
    phase: 2,
      dynamic: true,
  },
  {
    path: "/gift-card/:claimToken",
    label: "Gift Card",
    description: "Resgate de gift card",
    audience: "public",
    roles: ["visitor"],
    phase: 4,
      dynamic: true,
  },
  {
    path: "/instalar",
    label: "Instalar app",
    description: "Instruções PWA",
    audience: "public",
    roles: ["visitor"],
    phase: 3,
    },
  {
    path: "/politicas/:slug",
    label: "Políticas",
    description: "Página de política",
    audience: "public",
    roles: ["visitor"],
    phase: 0,
      dynamic: true,
  },
  {
    path: "/privacidade",
    label: "Privacidade",
    description: "Política de privacidade",
    audience: "public",
    roles: ["visitor"],
    phase: 0,
    },
  {
    path: "/termos",
    label: "Termos",
    description: "Termos de uso",
    audience: "public",
    roles: ["visitor"],
    phase: 0,
    },
  {
    path: "/trocas-e-devolucoes",
    label: "Trocas e devoluções",
    description: "Política de trocas",
    audience: "public",
    roles: ["visitor"],
    phase: 0,
    },
];

const CUSTOMER: Role[] = ["customer"];

export const CUSTOMER_ROUTES: RouteEntry[] = [
  {
    path: "/entrar",
    label: "Entrar",
    description: "Login da cliente",
    audience: "public",
    roles: ["visitor"],
    phase: 1,
    },
  {
    path: "/cadastro",
    label: "Cadastro",
    description: "Criar conta",
    audience: "public",
    roles: ["visitor"],
    phase: 1,
    },
  {
    path: "/recuperar-senha",
    label: "Recuperar senha",
    description: "Recuperação de senha",
    audience: "public",
    roles: ["visitor"],
    phase: 1,
    },
  {
    path: "/conta",
    label: "Minha conta",
    description: "Painel da cliente",
    audience: "customer",
    roles: CUSTOMER,
    phase: 1,
    },
  {
    path: "/conta/perfil",
    label: "Perfil",
    description: "Dados pessoais",
    audience: "customer",
    roles: CUSTOMER,
    phase: 1,
    },
  {
    path: "/conta/enderecos",
    label: "Endereços",
    description: "Endereços salvos",
    audience: "customer",
    roles: CUSTOMER,
    phase: 2,
    },
  {
    path: "/conta/pedidos",
    label: "Pedidos",
    description: "Histórico de pedidos",
    audience: "customer",
    roles: CUSTOMER,
    phase: 2,
    },
  {
    path: "/conta/pedidos/:id",
    label: "Pedido",
    description: "Detalhe do pedido",
    audience: "customer",
    roles: CUSTOMER,
    phase: 2,
      dynamic: true,
  },
  {
    path: "/conta/pagamentos",
    label: "Pagamentos",
    description: "Pagamentos da cliente",
    audience: "customer",
    roles: CUSTOMER,
    phase: 2,
    },
  {
    path: "/conta/creditos",
    label: "Créditos",
    description: "Saldo de créditos",
    audience: "customer",
    roles: CUSTOMER,
    phase: 4,
    },
  {
    path: "/conta/gift-cards",
    label: "Gift cards",
    description: "Gift cards da cliente",
    audience: "customer",
    roles: CUSTOMER,
    phase: 4,
    },
  {
    path: "/conta/avaliacoes",
    label: "Avaliações",
    description: "Avaliações enviadas",
    audience: "customer",
    roles: CUSTOMER,
    phase: 3,
    },
  {
    path: "/conta/trocas",
    label: "Trocas",
    description: "Solicitações de troca",
    audience: "customer",
    roles: CUSTOMER,
    phase: 4,
    },
  {
    path: "/conta/suporte",
    label: "Suporte",
    description: "Atendimento",
    audience: "customer",
    roles: CUSTOMER,
    phase: 4,
    },
  {
    path: "/conta/conversas/:id",
    label: "Conversa",
    description: "Thread de conversa",
    audience: "customer",
    roles: CUSTOMER,
    phase: 4,
      dynamic: true,
  },
  {
    path: "/conta/privacidade",
    label: "Privacidade",
    description: "Consentimentos e LGPD",
    audience: "customer",
    roles: CUSTOMER,
    phase: 3,
    },
];

const STAFF: Role[] = ["owner", "admin", "manager"];
const STAFF_ALL: Role[] = [
  "owner",
  "admin",
  "manager",
  "seller",
  "stock",
  "finance",
  "content",
  "support",
];

export const ADMIN_ROUTES: RouteEntry[] = [
  {
    path: "/admin",
    label: "Visão geral",
    description: "Dashboard do painel",
    audience: "admin",
    roles: STAFF_ALL,
    phase: 0,
      navGroup: "Geral",
    navIcon: "LayoutDashboard",
  },
  {
    path: "/admin/onboarding",
    label: "Onboarding",
    description: "Primeiros passos",
    audience: "admin",
    roles: STAFF,
    phase: 0,
      navGroup: "Geral",
    navIcon: "Store",
  },
  {
    path: "/admin/catalogo/produtos",
    label: "Produtos",
    description: "Lista de produtos",
    audience: "admin",
    roles: ["owner", "admin", "manager", "stock", "content"],
    phase: 1,
      navGroup: "Catálogo",
    navIcon: "Package",
    navPlanned: true,
  },
  {
    path: "/admin/catalogo/produtos/novo",
    label: "Novo produto",
    description: "Cadastro de produto",
    audience: "admin",
    roles: ["owner", "admin", "manager", "content"],
    phase: 1,
    },
  {
    path: "/admin/catalogo/produtos/:id",
    label: "Editar produto",
    description: "Edição de produto",
    audience: "admin",
    roles: ["owner", "admin", "manager", "content"],
    phase: 1,
      dynamic: true,
  },
  {
    path: "/admin/catalogo/tipos",
    label: "Tipos de produto",
    description: "Schemas de atributos",
    audience: "admin",
    roles: STAFF,
    phase: 1,
    },
  {
    path: "/admin/catalogo/categorias",
    label: "Categorias",
    description: "Árvore de categorias",
    audience: "admin",
    roles: STAFF,
    phase: 1,
    },
  {
    path: "/admin/catalogo/colecoes",
    label: "Coleções",
    description: "Coleções curadas",
    audience: "admin",
    roles: STAFF,
    phase: 1,
    },
  {
    path: "/admin/catalogo/atributos",
    label: "Atributos",
    description: "Definições de atributos",
    audience: "admin",
    roles: STAFF,
    phase: 1,
    },
  {
    path: "/admin/midias",
    label: "Mídias",
    description: "Biblioteca de mídia",
    audience: "admin",
    roles: ["owner", "admin", "manager", "content"],
    phase: 1,
    },
  {
    path: "/admin/estoque",
    label: "Estoque",
    description: "Estoque por variação",
    audience: "admin",
    roles: ["owner", "admin", "manager", "stock"],
    phase: 1,
    },
  {
    path: "/admin/estoque/movimentos",
    label: "Movimentos",
    description: "Movimentos de estoque",
    audience: "admin",
    roles: ["owner", "admin", "manager", "stock"],
    phase: 1,
    },
  {
    path: "/admin/estoque/alertas",
    label: "Alertas",
    description: "Alertas de estoque",
    audience: "admin",
    roles: ["owner", "admin", "manager", "stock"],
    phase: 1,
    },
  {
    path: "/admin/pedidos",
    label: "Pedidos",
    description: "Lista de pedidos",
    audience: "admin",
    roles: ["owner", "admin", "manager", "seller", "finance"],
    phase: 2,
    },
  {
    path: "/admin/pedidos/:id",
    label: "Pedido",
    description: "Detalhe do pedido",
    audience: "admin",
    roles: ["owner", "admin", "manager", "seller", "finance"],
    phase: 2,
      dynamic: true,
  },
  {
    path: "/admin/fretes",
    label: "Fretes",
    description: "Estratégias de frete",
    audience: "admin",
    roles: STAFF,
    phase: 2,
    },
  {
    path: "/admin/fretes/tabelas",
    label: "Tabelas de frete",
    description: "Frete manual",
    audience: "admin",
    roles: STAFF,
    phase: 2,
    },
  {
    path: "/admin/fretes/cotacoes",
    label: "Cotações",
    description: "Cotações manuais",
    audience: "admin",
    roles: STAFF,
    phase: 2,
    },
  {
    path: "/admin/pagamentos",
    label: "Pagamentos",
    description: "Pagamentos recebidos",
    audience: "admin",
    roles: ["owner", "admin", "finance"],
    phase: 2,
    },
  {
    path: "/admin/comprovantes",
    label: "Comprovantes",
    description: "Comprovantes manuais",
    audience: "admin",
    roles: ["owner", "admin", "finance"],
    phase: 2,
    },
  {
    path: "/admin/clientes",
    label: "Clientes",
    description: "Lista de clientes",
    audience: "admin",
    roles: ["owner", "admin", "manager", "seller", "support"],
    phase: 4,
    },
  {
    path: "/admin/clientes/:id",
    label: "Cliente",
    description: "Ficha 360 da cliente",
    audience: "admin",
    roles: ["owner", "admin", "manager", "seller", "support"],
    phase: 4,
      dynamic: true,
  },
  {
    path: "/admin/suporte",
    label: "Suporte",
    description: "Atendimentos",
    audience: "admin",
    roles: ["owner", "admin", "manager", "support"],
    phase: 4,
    },
  {
    path: "/admin/conversas",
    label: "Conversas",
    description: "Chat com clientes",
    audience: "admin",
    roles: ["owner", "admin", "manager", "support"],
    phase: 4,
    },
  {
    path: "/admin/trocas",
    label: "Trocas",
    description: "Trocas e devoluções",
    audience: "admin",
    roles: ["owner", "admin", "manager", "support"],
    phase: 4,
    },
  {
    path: "/admin/avaliacoes",
    label: "Avaliações",
    description: "Moderação de avaliações",
    audience: "admin",
    roles: ["owner", "admin", "manager", "content"],
    phase: 3,
    },
  {
    path: "/admin/cms/paginas",
    label: "Páginas",
    description: "Páginas do CMS",
    audience: "admin",
    roles: ["owner", "admin", "content"],
    phase: 3,
    },
  {
    path: "/admin/cms/paginas/:id/editor",
    label: "Editor de página",
    description: "Editor por seções",
    audience: "admin",
    roles: ["owner", "admin", "content"],
    phase: 3,
      dynamic: true,
  },
  {
    path: "/admin/cms/navegacao",
    label: "Navegação",
    description: "Menus de navegação",
    audience: "admin",
    roles: ["owner", "admin", "content"],
    phase: 3,
    },
  {
    path: "/admin/cms/tema",
    label: "Tema",
    description: "Editor de tema",
    audience: "admin",
    roles: ["owner", "admin", "content"],
    phase: 3,
    },
  {
    path: "/admin/stories",
    label: "Stories",
    description: "Gestão de stories",
    audience: "admin",
    roles: ["owner", "admin", "content"],
    phase: 3,
    },
  {
    path: "/admin/destaques",
    label: "Destaques",
    description: "Destaques permanentes",
    audience: "admin",
    roles: ["owner", "admin", "content"],
    phase: 3,
    },
  {
    path: "/admin/perfil-publico",
    label: "Perfil público",
    description: "Portfólio da loja",
    audience: "admin",
    roles: ["owner", "admin", "content"],
    phase: 3,
    },
  {
    path: "/admin/link-da-bio",
    label: "Link da bio",
    description: "Página de links",
    audience: "admin",
    roles: ["owner", "admin", "content"],
    phase: 3,
    },
  {
    path: "/admin/marketing/cupons",
    label: "Cupons",
    description: "Cupons de desconto",
    audience: "admin",
    roles: ["owner", "admin", "manager"],
    phase: 5,
    },
  {
    path: "/admin/marketing/gift-cards",
    label: "Gift cards",
    description: "Gestão de gift cards",
    audience: "admin",
    roles: ["owner", "admin", "finance"],
    phase: 4,
    },
  {
    path: "/admin/marketing/carrinhos",
    label: "Carrinhos",
    description: "Carrinhos abandonados",
    audience: "admin",
    roles: ["owner", "admin", "manager"],
    phase: 5,
    },
  {
    path: "/admin/marketing/notificacoes",
    label: "Notificações",
    description: "Push e campanhas",
    audience: "admin",
    roles: ["owner", "admin", "manager"],
    phase: 5,
    },
  {
    path: "/admin/marketing/feed",
    label: "Feeds",
    description: "Feeds Meta/Google",
    audience: "admin",
    roles: ["owner", "admin", "manager"],
    phase: 5,
    },
  {
    path: "/admin/match-time",
    label: "Match Time",
    description: "Recomendação por swipe",
    audience: "admin",
    roles: ["owner", "admin", "manager"],
    phase: 5,
    },
  {
    path: "/admin/criador",
    label: "Criador",
    description: "Criador de posts/arte",
    audience: "admin",
    roles: ["owner", "admin", "content"],
    phase: 5,
    },
  {
    path: "/admin/caixa",
    label: "Caixa",
    description: "Caixa e frente de loja",
    audience: "admin",
    roles: ["owner", "admin", "manager", "seller", "finance"],
    phase: 4,
    },
  {
    path: "/admin/caixa/turnos",
    label: "Turnos",
    description: "Turnos de caixa",
    audience: "admin",
    roles: ["owner", "admin", "manager", "finance"],
    phase: 4,
    },
  {
    path: "/admin/caixa/lancamentos",
    label: "Lançamentos",
    description: "Entradas e saídas de caixa",
    audience: "admin",
    roles: ["owner", "admin", "manager", "finance"],
    phase: 4,
    },
  {
    path: "/admin/comissoes",
    label: "Comissões",
    description: "Comissões da equipe",
    audience: "admin",
    roles: ["owner", "admin", "finance"],
    phase: 4,
    },
  {
    path: "/admin/equipe",
    label: "Equipe",
    description: "Usuários e papéis",
    audience: "admin",
    roles: ["owner", "admin"],
    phase: 1,
    },
  {
    path: "/admin/relatorios",
    label: "Relatórios",
    description: "Relatórios e métricas",
    audience: "admin",
    roles: ["owner", "admin", "manager", "finance"],
    phase: 4,
    },
  {
    path: "/admin/integracoes",
    label: "Integrações",
    description: "Conexões externas",
    audience: "admin",
    roles: ["owner", "admin"],
    phase: 5,
    },
  {
    path: "/admin/configuracoes/loja",
    label: "Loja",
    description: "Dados da loja",
    audience: "admin",
    roles: ["owner", "admin"],
    phase: 0,
    },
  {
    path: "/admin/configuracoes/politicas",
    label: "Políticas",
    description: "Políticas e termos",
    audience: "admin",
    roles: ["owner", "admin"],
    phase: 3,
    },
  {
    path: "/admin/configuracoes/lgpd",
    label: "LGPD",
    description: "Privacidade e consentimentos",
    audience: "admin",
    roles: ["owner", "admin"],
    phase: 3,
    },
  {
    path: "/admin/configuracoes/auditoria",
    label: "Auditoria",
    description: "Log de auditoria",
    audience: "admin",
    roles: ["owner", "admin"],
    phase: 4,
    },
  {
    path: "/admin/configuracoes/seo",
    label: "SEO",
    description: "Configurações de SEO",
    audience: "admin",
    roles: ["owner", "admin", "content"],
    phase: 3,
    },
];

export const ALL_ROUTES: RouteEntry[] = [...PUBLIC_ROUTES, ...CUSTOMER_ROUTES, ...ADMIN_ROUTES];

export function getRoute(path: string): RouteEntry | undefined {
  return ALL_ROUTES.find((r) => r.path === path);
}

// ---------------------------------------------------------------------------
// Admin sidebar navigation (canonical — AdminShell must consume this)
// ---------------------------------------------------------------------------

/**
 * A nav group entry for the admin sidebar.
 * Icons are referenced by name string (resolved to LucideIcon in the shell).
 */
export interface AdminNavItem {
  path: string;
  label: string;
  /** Lucide icon name. Resolved to the actual icon in admin-shell.tsx. */
  icon: string;
  planned?: boolean;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

/**
 * Canonical admin sidebar navigation groups.
 * Update THIS list — never the NAV array inside admin-shell.tsx.
 * Keep in sync with docs/ROUTES.md.
 */
export const ADMIN_SIDEBAR_NAV: AdminNavGroup[] = [
  {
    title: "Geral",
    items: [
      { path: "/admin", label: "Visão geral", icon: "LayoutDashboard" },
      { path: "/admin/onboarding", label: "Onboarding", icon: "Store" },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { path: "/admin/catalogo/produtos", label: "Produtos", icon: "Package", planned: true },
      { path: "/admin/estoque", label: "Estoque", icon: "Boxes", planned: true },
      { path: "/admin/midias", label: "Mídias", icon: "Images", planned: true },
    ],
  },
  {
    title: "Vendas",
    items: [
      { path: "/admin/pedidos", label: "Pedidos", icon: "ShoppingCart", planned: true },
      { path: "/admin/fretes", label: "Fretes", icon: "Truck", planned: true },
      { path: "/admin/pagamentos", label: "Pagamentos", icon: "CreditCard", planned: true },
    ],
  },
  {
    title: "Relacionamento",
    items: [
      { path: "/admin/clientes", label: "Clientes", icon: "Users", planned: true },
      { path: "/admin/conversas", label: "Conversas", icon: "MessagesSquare", planned: true },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { path: "/admin/cms/paginas", label: "Páginas", icon: "FileText", planned: true },
      { path: "/admin/marketing/cupons", label: "Marketing", icon: "Megaphone", planned: true },
    ],
  },
  {
    title: "Operação",
    items: [
      { path: "/admin/caixa", label: "Caixa", icon: "Wallet", planned: true },
      { path: "/admin/relatorios", label: "Relatórios", icon: "BarChart3", planned: true },
      { path: "/admin/configuracoes/loja", label: "Configurações", icon: "Settings" },
    ],
  },
];

/** Bottom nav items for the admin mobile bar (also canonical). */
export const ADMIN_BOTTOM_NAV: AdminNavItem[] = [
  { path: "/admin", label: "Início", icon: "LayoutDashboard" },
  { path: "/admin/catalogo/produtos", label: "Produtos", icon: "Package" },
  { path: "/admin/pedidos", label: "Pedidos", icon: "ShoppingCart" },
  { path: "/admin/configuracoes/loja", label: "Ajustes", icon: "Settings" },
];

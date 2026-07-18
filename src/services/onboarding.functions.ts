import { createServerFn } from "@tanstack/react-start";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

export type OnboardingStepStatus =
  | "unconfigured"
  | "partially_configured"
  | "completed"
  | "locked"
  | "technical_error";

export interface OnboardingStep {
  id: string;
  category: "fundamentos" | "catalogo" | "vendas" | "divulgacao";
  label: string;
  description: string;
  status: OnboardingStepStatus;
  targetRoute: string;
  details?: string;
}

export interface OnboardingOverview {
  steps: OnboardingStep[];
  totalSteps: number;
  completedSteps: number;
  partiallyConfiguredSteps: number;
  progressPercentage: number;
  isStoreReadyToSell: boolean;
}

export async function getOnboardingStatusHandler(): Promise<OnboardingOverview> {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "finance", "stock", "content", "support"]);

  const db = getServerClient();
  const storeId = identity.store_id;

  // Safe individual queries to catch technical errors per query without failing everything
  const fetchStore = async () => {
    try {
      const { data, error } = await db
        .from("stores")
        .select("id, name, email, phone, cnpj, address, city, state, zip_code, logo_url, policies, seo_title, seo_description, pix_key")
        .eq("id", storeId)
        .single();
      if (error) return { status: "error" as const, error: error.message };
      return { status: "ok" as const, data };
    } catch (e: any) {
      return { status: "error" as const, error: e.message || "Erro de banco" };
    }
  };

  const fetchCount = async (table: string, filterColumn?: string, filterValue?: any) => {
    try {
      let query = db.from(table).select("id", { count: "exact", head: true });
      if (filterColumn && filterValue !== undefined) {
        query = query.eq(filterColumn, filterValue);
      }
      const { count, error } = await query;
      if (error) return { status: "error" as const, error: error.message };
      return { status: "ok" as const, count: count ?? 0 };
    } catch (e: any) {
      return { status: "error" as const, error: e.message };
    }
  };

  const fetchStockVariants = async () => {
    try {
      const { count, error } = await db
        .from("product_variants")
        .select("id", { count: "exact", head: true })
        .gt("stock_on_hand", 0);
      if (error) return { status: "error" as const, error: error.message };
      return { status: "ok" as const, count: count ?? 0 };
    } catch (e: any) {
      return { status: "error" as const, error: e.message };
    }
  };

  const [
    storeRes,
    shippingRes,
    categoriesRes,
    productsRes,
    stockRes,
    ordersRes,
    couponsRes,
  ] = await Promise.all([
    fetchStore(),
    fetchCount("shipping_rates"),
    fetchCount("categories"),
    fetchCount("products"),
    fetchStockVariants(),
    fetchCount("orders"),
    fetchCount("coupons"),
  ]);

  const steps: OnboardingStep[] = [];

  // 1. Perfil da Loja
  if (storeRes.status === "error") {
    steps.push({
      id: "profile",
      category: "fundamentos",
      label: "Perfil e Dados da Loja",
      description: "Nome, telefone e e-mail de contato comercial da empresa.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/loja",
      details: storeRes.error,
    });
  } else {
    const s = storeRes.data;
    const hasName = Boolean(s?.name);
    const hasContact = Boolean(s?.phone || s?.email);

    let status: OnboardingStepStatus = "unconfigured";
    if (hasName && hasContact) status = "completed";
    else if (hasName || hasContact) status = "partially_configured";

    steps.push({
      id: "profile",
      category: "fundamentos",
      label: "Perfil e Dados da Loja",
      description: "Nome, telefone e e-mail de contato comercial da empresa.",
      status,
      targetRoute: "/admin/configuracoes/loja",
      details: status === "completed" ? "Perfil completo" : "Pendente complemento de dados",
    });
  }

  // 2. Logo da Loja
  if (storeRes.status === "error") {
    steps.push({
      id: "logo",
      category: "fundamentos",
      label: "Logotipo da Loja",
      description: "Identidade visual da marca para o cabeçalho e recibos.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/loja",
    });
  } else {
    const hasLogo = Boolean(storeRes.data?.logo_url);
    steps.push({
      id: "logo",
      category: "fundamentos",
      label: "Logotipo da Loja",
      description: "Identidade visual da marca para o cabeçalho e recibos.",
      status: hasLogo ? "completed" : "unconfigured",
      targetRoute: "/admin/configuracoes/loja",
      details: hasLogo ? "Logotipo cadastrado" : "Envie a imagem da sua marca",
    });
  }

  // 3. Endereço
  if (storeRes.status === "error") {
    steps.push({
      id: "address",
      category: "fundamentos",
      label: "Endereço Físico ou Sede",
      description: "Endereço de saída dos fretes e atendimento.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/loja",
    });
  } else {
    const s = storeRes.data;
    const hasStreet = Boolean(s?.address);
    const hasCityState = Boolean(s?.city && s?.state);

    let status: OnboardingStepStatus = "unconfigured";
    if (hasStreet && hasCityState) status = "completed";
    else if (hasStreet || hasCityState) status = "partially_configured";

    steps.push({
      id: "address",
      category: "fundamentos",
      label: "Endereço Físico ou Sede",
      description: "Endereço de saída dos fretes e atendimento.",
      status,
      targetRoute: "/admin/configuracoes/loja",
      details: status === "completed" ? "Endereço completo" : "Informe o endereço da loja",
    });
  }

  // 4. Pagamentos
  if (storeRes.status === "error") {
    steps.push({
      id: "payment",
      category: "fundamentos",
      label: "Formas de Pagamento",
      description: "Configuração de chave Pix manual e métodos de cobrança.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/pagamentos",
    });
  } else {
    const isPixEnabled = Boolean(storeRes.data?.pix_key);
    steps.push({
      id: "payment",
      category: "fundamentos",
      label: "Formas de Pagamento",
      description: "Configuração de chave Pix manual e métodos de cobrança.",
      status: isPixEnabled ? "completed" : "unconfigured",
      targetRoute: "/admin/configuracoes/pagamentos",
      details: isPixEnabled ? "Pix ativado" : "Ative o Pix para receber pagamentos",
    });
  }

  // 5. Frete e Envio
  if (shippingRes.status === "error") {
    steps.push({
      id: "shipping",
      category: "fundamentos",
      label: "Tabelas de Frete e Entrega",
      description: "Opções de envio por região ou retirada presencial.",
      status: "technical_error",
      targetRoute: "/admin/fretes/tabelas",
    });
  } else {
    const count = shippingRes.count;
    steps.push({
      id: "shipping",
      category: "fundamentos",
      label: "Tabelas de Frete e Entrega",
      description: "Opções de envio por região ou retirada presencial.",
      status: count > 0 ? "completed" : "unconfigured",
      targetRoute: "/admin/fretes/tabelas",
      details: count > 0 ? `${count} tabela(s) ativa(s)` : "Cadastre uma taxa de entrega",
    });
  }

  // 6. Categorias
  if (categoriesRes.status === "error") {
    steps.push({
      id: "categories",
      category: "catalogo",
      label: "Categorias de Produtos",
      description: "Organização do catálogo por seções e departamentos.",
      status: "technical_error",
      targetRoute: "/admin/catalogo/categorias",
    });
  } else {
    const count = categoriesRes.count;
    steps.push({
      id: "categories",
      category: "catalogo",
      label: "Categorias de Produtos",
      description: "Organização do catálogo por seções e departamentos.",
      status: count > 0 ? "completed" : "unconfigured",
      targetRoute: "/admin/catalogo/categorias",
      details: count > 0 ? `${count} categoria(s) cadastrada(s)` : "Crie a primeira categoria",
    });
  }

  // 7. Primeiro Produto
  if (productsRes.status === "error") {
    steps.push({
      id: "first_product",
      category: "catalogo",
      label: "Cadastro do Primeiro Produto",
      description: "Inclusão de produto com título, preço e fotos na vitrine.",
      status: "technical_error",
      targetRoute: "/admin/catalogo/produtos/novo",
    });
  } else {
    const count = productsRes.count;
    steps.push({
      id: "first_product",
      category: "catalogo",
      label: "Cadastro do Primeiro Produto",
      description: "Inclusão de produto com título, preço e fotos na vitrine.",
      status: count > 0 ? "completed" : "unconfigured",
      targetRoute: "/admin/catalogo/produtos/novo",
      details: count > 0 ? `${count} produto(s) no catálogo` : "Adicione seu primeiro produto",
    });
  }

  // 8. Estoque
  if (stockRes.status === "error") {
    steps.push({
      id: "stock",
      category: "catalogo",
      label: "Estoque Inicial por Variação",
      description: "Disponibilização de saldo para venda por tamanho/cor.",
      status: "technical_error",
      targetRoute: "/admin/estoque",
    });
  } else {
    const count = stockRes.count;
    const hasProducts = productsRes.status === "ok" && productsRes.count > 0;
    let status: OnboardingStepStatus = "unconfigured";
    if (count > 0) status = "completed";
    else if (!hasProducts) status = "locked";

    steps.push({
      id: "stock",
      category: "catalogo",
      label: "Estoque Inicial por Variação",
      description: "Disponibilização de saldo para venda por tamanho/cor.",
      status,
      targetRoute: "/admin/estoque",
      details: status === "locked" ? "Cadastre um produto antes" : status === "completed" ? `${count} variação(ões) com saldo` : "Adicione estoque",
    });
  }

  // 9. Políticas
  if (storeRes.status === "error") {
    steps.push({
      id: "policies",
      category: "fundamentos",
      label: "Políticas da Loja",
      description: "Termos de trocas, devoluções e privacidade.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/politicas",
    });
  } else {
    const p = storeRes.data?.policies as any;
    const hasReturns = Boolean(p?.returns || p?.terms);

    steps.push({
      id: "policies",
      category: "fundamentos",
      label: "Políticas da Loja",
      description: "Termos de trocas, devoluções e privacidade.",
      status: hasReturns ? "completed" : "unconfigured",
      targetRoute: "/admin/configuracoes/politicas",
      details: hasReturns ? "Políticas configuradas" : "Defina as regras de troca",
    });
  }

  // 10. SEO
  if (storeRes.status === "error") {
    steps.push({
      id: "seo",
      category: "divulgacao",
      label: "SEO e Indexação no Google",
      description: "Título e descrição para compartilhamento social e buscadores.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/seo",
    });
  } else {
    const s = storeRes.data;
    const hasTitle = Boolean(s?.seo_title);
    const hasDesc = Boolean(s?.seo_description);

    let status: OnboardingStepStatus = "unconfigured";
    if (hasTitle && hasDesc) status = "completed";
    else if (hasTitle || hasDesc) status = "partially_configured";

    steps.push({
      id: "seo",
      category: "divulgacao",
      label: "SEO e Indexação no Google",
      description: "Título e descrição para compartilhamento social e buscadores.",
      status,
      targetRoute: "/admin/configuracoes/seo",
      details: status === "completed" ? "Metadados configurados" : "Configure as tags SEO",
    });
  }

  // 11. Primeiro Pedido
  if (ordersRes.status === "error") {
    steps.push({
      id: "first_order",
      category: "vendas",
      label: "Primeiro Pedido Realizado",
      description: "Primeira venda efetuada no e-commerce ou no PDV.",
      status: "technical_error",
      targetRoute: "/admin/pedidos",
    });
  } else {
    const count = ordersRes.count;
    const isReadyToSell =
      productsRes.status === "ok" &&
      productsRes.count > 0 &&
      storeRes.status === "ok" &&
      Boolean(storeRes.data?.pix_key);

    let status: OnboardingStepStatus = "unconfigured";
    if (count > 0) status = "completed";
    else if (!isReadyToSell) status = "locked";

    steps.push({
      id: "first_order",
      category: "vendas",
      label: "Primeiro Pedido Realizado",
      description: "Primeira venda efetuada no e-commerce ou no PDV.",
      status,
      targetRoute: "/admin/pedidos",
      details: status === "locked" ? "Configure produto e pagamento antes" : status === "completed" ? `${count} pedido(s) recebido(s)` : "Aguardando primeira venda",
    });
  }

  // 12. Primeira Campanha / Cupom
  if (couponsRes.status === "error") {
    steps.push({
      id: "first_campaign",
      category: "divulgacao",
      label: "Cupom de Desconto Inicial",
      description: "Criação de cupom para atrair as primeiras clientes.",
      status: "technical_error",
      targetRoute: "/admin/marketing/cupons",
    });
  } else {
    const count = couponsRes.count;
    steps.push({
      id: "first_campaign",
      category: "divulgacao",
      label: "Cupom de Desconto Inicial",
      description: "Criação de cupom para atrair as primeiras clientes.",
      status: count > 0 ? "completed" : "unconfigured",
      targetRoute: "/admin/marketing/cupons",
      details: count > 0 ? `${count} cupom(ns) ativo(s)` : "Crie um cupom de boas-vindas",
    });
  }

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const partiallyConfiguredSteps = steps.filter((s) => s.status === "partially_configured").length;
  const progressPercentage = Math.round(((completedSteps + partiallyConfiguredSteps * 0.5) / totalSteps) * 100);

  const hasProduct = steps.find((s) => s.id === "first_product")?.status === "completed";
  const hasPayment = steps.find((s) => s.id === "payment")?.status === "completed";
  const isStoreReadyToSell = Boolean(hasProduct && hasPayment);

  return {
    steps,
    totalSteps,
    completedSteps,
    partiallyConfiguredSteps,
    progressPercentage,
    isStoreReadyToSell,
  };
}

export const getOnboardingStatus = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await getOnboardingStatusHandler();
    return { status: "ok" as const, data };
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[onboarding.functions] getOnboardingStatus error:", e?.message || e);
    return { status: "error" as const, message: e?.message || "Erro ao carregar etapas de configuração." };
  }
});

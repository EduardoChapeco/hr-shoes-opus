import { createServerFn } from "@tanstack/react-start";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";

export interface DashboardMetrics {
  salesTodayCents: number;
  salesMonthCents: number;
  ordersTodayCount: number;
  ordersMonthCount: number;
  ordersBreakdown: {
    awaitingPayment: number;
    needsSeparation: number;
    shippedOrReady: number;
    completed: number;
    cancelled: number;
  };
  lowStockItems: Array<{
    id: string;
    sku: string;
    productTitle: string;
    stockOnHand: number;
  }>;
  criticalStockCount: number;
  newCustomers30d: number;
  abandonedCartsCount: number;
  activeCashRegister: {
    isOpen: boolean;
    openedAt?: string;
    initialBalanceCents?: number;
    currentBalanceCents?: number;
    openedByName?: string;
  } | null;
  setupChecklist: Array<{
    id: string;
    label: string;
    description: string;
    completed: boolean;
    targetRoute: string;
  }>;
  setupProgressPercentage: number;
}

export async function getDashboardDataHandler(): Promise<DashboardMetrics> {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "finance", "stock", "content", "support"]);

  const db = getServerClient();
  const storeId = identity.store_id;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch Orders metrics
  const { data: ordersData } = await db
    .from("orders")
    .select("id, status, total_cents, created_at")
    .eq("store_id", storeId);

  const validOrders = ordersData ?? [];

  let salesTodayCents = 0;
  let salesMonthCents = 0;
  let ordersTodayCount = 0;
  let ordersMonthCount = 0;

  const ordersBreakdown = {
    awaitingPayment: 0,
    needsSeparation: 0,
    shippedOrReady: 0,
    completed: 0,
    cancelled: 0,
  };

  const PAID_STATUSES = new Set(["paid", "processing", "ready_for_pickup", "shipped", "delivered", "completed"]);

  for (const order of validOrders) {
    const isToday = order.created_at >= startOfToday;
    const isThisMonth = order.created_at >= startOfMonth;

    if (isToday) ordersTodayCount++;
    if (isThisMonth) ordersMonthCount++;

    if (PAID_STATUSES.has(order.status)) {
      if (isToday) salesTodayCents += order.total_cents ?? 0;
      if (isThisMonth) salesMonthCents += order.total_cents ?? 0;
    }

    switch (order.status) {
      case "awaiting_payment":
      case "payment_processing":
      case "awaiting_shipping_quote":
        ordersBreakdown.awaitingPayment++;
        break;
      case "paid":
      case "processing":
        ordersBreakdown.needsSeparation++;
        break;
      case "ready_for_pickup":
      case "shipped":
        ordersBreakdown.shippedOrReady++;
        break;
      case "completed":
      case "delivered":
        ordersBreakdown.completed++;
        break;
      case "cancelled":
      case "payment_failed":
        ordersBreakdown.cancelled++;
        break;
    }
  }

  // 2. Low stock items
  const { data: variantRows } = await db
    .from("product_variants")
    .select("id, sku, stock_on_hand, products(title)")
    .lte("stock_on_hand", 5)
    .order("stock_on_hand", { ascending: true })
    .limit(5);

  const lowStockItems = ((variantRows ?? []) as any[]).map((v) => ({
    id: v.id,
    sku: v.sku ?? "Sem SKU",
    productTitle: Array.isArray(v.products) ? v.products[0]?.title ?? "Produto" : v.products?.title ?? "Produto",
    stockOnHand: v.stock_on_hand ?? 0,
  }));

  // 3. New Customers (last 30d)
  const { count: newCustomers30d } = await db
    .from("customers")
    .select("id", { count: "exact", head: true })
    .gte("created_at", last30Days);

  // 4. Abandoned Carts (last 7d)
  const { count: abandonedCartsCount } = await db
    .from("carts")
    .select("id", { count: "exact", head: true })
    .gte("updated_at", last7Days);

  // 5. Active Cash Register
  const { data: activeRegister } = await db
    .from("cash_registers")
    .select("id, opened_at, initial_balance_cents, opened_by")
    .eq("store_id", storeId)
    .eq("status", "open")
    .maybeSingle();

  let activeCashRegister: DashboardMetrics["activeCashRegister"] = null;

  if (activeRegister) {
    const { data: entries } = await db
      .from("cash_register_entries")
      .select("amount_cents")
      .eq("register_id", activeRegister.id);

    const initial = activeRegister.initial_balance_cents ?? 0;
    const entriesTotal = (entries ?? []).reduce((acc, curr) => acc + (curr.amount_cents ?? 0), 0);

    activeCashRegister = {
      isOpen: true,
      openedAt: activeRegister.opened_at,
      initialBalanceCents: initial,
      currentBalanceCents: initial + entriesTotal,
    };
  } else {
    activeCashRegister = { isOpen: false };
  }

  // 6. Setup Checklist
  const [storeRes, productsRes, categoriesRes, paymentRes, shippingRes] = await Promise.all([
    db.from("stores").select("name, phone, address").eq("id", storeId).single(),
    db.from("products").select("id", { count: "exact", head: true }),
    db.from("categories").select("id", { count: "exact", head: true }),
    db.from("store_payment_settings").select("pix_manual_enabled").eq("store_id", storeId).maybeSingle(),
    db.from("shipping_rates").select("id", { count: "exact", head: true }),
  ]);

  const storeInfo = storeRes.data;
  const hasStoreProfile = Boolean(storeInfo?.name && (storeInfo?.phone || storeInfo?.address));
  const hasProducts = (productsRes.count ?? 0) > 0;
  const hasCategories = (categoriesRes.count ?? 0) > 0;
  const hasPayment = Boolean(paymentRes.data?.pix_manual_enabled);
  const hasShipping = (shippingRes.count ?? 0) > 0;

  const setupChecklist = [
    {
      id: "profile",
      label: "Perfil e Contato da Loja",
      description: "Cadastre nome, telefone ou endereço principal da sua loja.",
      completed: hasStoreProfile,
      targetRoute: "/admin/configuracoes/loja",
    },
    {
      id: "categories",
      label: "Categorias do Catálogo",
      description: "Crie pelo menos uma categoria para organizar seus produtos.",
      completed: hasCategories,
      targetRoute: "/admin/catalogo/categorias",
    },
    {
      id: "products",
      label: "Primeiro Produto",
      description: "Cadastre seu primeiro produto com fotos e preço.",
      completed: hasProducts,
      targetRoute: "/admin/catalogo/produtos/novo",
    },
    {
      id: "payment",
      label: "Formas de Pagamento",
      description: "Ative a chave Pix ou pagamentos manuais.",
      completed: hasPayment,
      targetRoute: "/admin/configuracoes/pagamentos",
    },
    {
      id: "shipping",
      label: "Tabela de Frete",
      description: "Configure opções de entrega ou retirada na loja.",
      completed: hasShipping,
      targetRoute: "/admin/fretes/tabelas",
    },
  ];

  const completedCount = setupChecklist.filter((c) => c.completed).length;
  const setupProgressPercentage = Math.round((completedCount / setupChecklist.length) * 100);

  return {
    salesTodayCents,
    salesMonthCents,
    ordersTodayCount,
    ordersMonthCount,
    ordersBreakdown,
    lowStockItems,
    criticalStockCount: lowStockItems.length,
    newCustomers30d: newCustomers30d ?? 0,
    abandonedCartsCount: abandonedCartsCount ?? 0,
    activeCashRegister,
    setupChecklist,
    setupProgressPercentage,
  };
}

export const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await getDashboardDataHandler();
    return { status: "ok" as const, data };
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[dashboard.functions] getDashboardData error:", e?.message || e);
    return { status: "error" as const, message: e?.message || "Erro ao carregar dados do painel." };
  }
});

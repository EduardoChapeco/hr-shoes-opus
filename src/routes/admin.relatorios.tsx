import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart3, TrendingUp, ShoppingCart, Users, DollarSign } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { formatMoney } from "@/lib/money";
import { getServerClient } from "@/lib/supabase";
import { createServerFn } from "@tanstack/react-start";

const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const { data: storeData } = await db.from("stores").select("id").limit(1).single();
    if (!storeData) return { status: "unconfigured" as const };

    const storeId = storeData.id;

    const [ordersRes, productsRes, customersRes] = await Promise.all([
      db.from("orders").select("total_cents, status").eq("store_id", storeId),
      db.from("products").select("id, status").eq("store_id", storeId),
      db.from("profiles").select("id").eq("store_id", storeId).eq("role", "customer"),
    ]);

    const orders = ordersRes.data || [];
    const paidOrders = orders.filter((o) =>
      ["paid", "processing", "shipped", "delivered", "completed"].includes(o.status),
    );
    const revenueCents = paidOrders.reduce((sum, o) => sum + (o.total_cents || 0), 0);

    return {
      totalRevenueCents: revenueCents,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      totalProducts: productsRes.data?.length || 0,
      publishedProducts: productsRes.data?.filter((p) => p.status === "published").length || 0,
      totalCustomers: customersRes.data?.length || 0,
    };
  } catch (e: any) {
    console.error("[admin.relatorios] getDashboardStats:", e);
    throw new Error("Erro ao carregar estatísticas.");
  }
});

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Hr Shoes" }] }),
  loader: async () => {
    return await getDashboardStats();
  },
  component: ReportsPage,
});

function StatCard({
  icon: Icon,
  title,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ReportsPage() {
  const res = Route.useLoaderData();

  if (res.status === "unconfigured") {
    return (
      <div className="space-y-6">
        <PageHeader title="Relatórios" description="Visão consolidada do desempenho da loja." />
        <p className="text-muted-foreground text-sm">Loja não configurada.</p>
      </div>
    );
  }

  const d = res;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Relatórios"
        description="Métricas extraídas em tempo real da base de dados da loja."
        eyebrow="Operação"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={DollarSign}
          title="Receita Total (Pedidos Pagos)"
          value={formatMoney(d.totalRevenueCents)}
          sub={`${d.paidOrders} pedidos pagos`}
        />
        <StatCard
          icon={ShoppingCart}
          title="Total de Pedidos"
          value={String(d.totalOrders)}
          sub={`${d.paidOrders} confirmados`}
        />
        <StatCard
          icon={TrendingUp}
          title="Produtos Publicados"
          value={String(d.publishedProducts)}
          sub={`${d.totalProducts} produtos no total`}
        />
        <StatCard icon={Users} title="Clientes Cadastrados" value={String(d.totalCustomers)} />
      </div>

      <div className="rounded-lg border bg-card p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground text-center">
          Gráficos de vendas por período e análise de funil serão adicionados na próxima fase de
          análise de dados. As métricas acima são calculadas em tempo real.
        </p>
      </div>
    </div>
  );
}

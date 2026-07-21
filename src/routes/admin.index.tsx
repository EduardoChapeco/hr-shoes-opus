import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Users,
  Wallet,
  Store,
  Plus,
  ArrowRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Box,
  Truck,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ErrorState, EmptyState } from "@/components/state/states";
import { formatMoney } from "@/lib/money";
import { getDashboardData, type DashboardMetrics } from "@/services/dashboard.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Centro de Comando — Hr Shoes" }] }),
  loader: async () => {
    return await getDashboardData();
  },
  errorComponent: ({ error }) => <DashboardErrorState error={error} />,
  component: DashboardPage,
});

function DashboardErrorState({ error }: { error: Error }) {
  if (error.message.includes("SupabaseUnconfiguredError") || error.name === "SupabaseUnconfiguredError") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Painel"
          title="Centro de Comando"
          description="Sua plataforma comercial integrada."
        />
        <ErrorState
          title="Loja não configurada ou sem conexão"
          description="O serviço Supabase não está configurado ou sua conta não possui uma loja vinculada. Verifique as variáveis de ambiente ou o cadastro em Configurações."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Painel de Controle"
        title="Visão Geral"
        description="Centro de comando comercial da loja."
      />
      <ErrorState
        title="Erro ao carregar o painel"
        description={error.message || "Não foi possível carregar as métricas operacionais da loja."}
      />
    </div>
  );
}

function DashboardPage() {
  const metrics = Route.useLoaderData();

  const {
    salesTodayCents,
    salesMonthCents,
    ordersTodayCount,
    ordersMonthCount,
    ordersBreakdown,
    lowStockItems,
    criticalStockCount,
    newCustomers30d,
    abandonedCartsCount,
    activeCashRegister,
    setupChecklist,
    setupProgressPercentage,
  } = metrics;

  return (
    <div className="space-y-8">
      {/* Header com Ações Rápidas */}
      <PageHeader
        eyebrow="Centro de Comando Comercial"
        title="Visão Geral da Loja"
        description="Acompanhamento operacional em tempo real de vendas, caixa, pedidos e estoque."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/catalogo/produtos/novo">
                <Plus className="size-4 mr-1.5" aria-hidden />
                Novo Produto
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/caixa">
                <Wallet className="size-4 mr-1.5" aria-hidden />
                Ir ao Caixa
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/pedidos">
                <ShoppingCart className="size-4 mr-1.5" aria-hidden />
                Ver Pedidos
              </Link>
            </Button>
          </div>
        }
      />

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vendas Hoje
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="size-4" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatMoney(salesTodayCents)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="font-medium text-foreground">{ordersTodayCount}</span> pedidos realizados hoje
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vendas no Mês
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="size-4" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatMoney(salesMonthCents)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="font-medium text-foreground">{ordersMonthCount}</span> pedidos no mês atual
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estoque Crítico
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {criticalStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalStockCount > 0 ? "Itens com 5 unidades ou menos" : "Estoque regularizado"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Caixa em Turno
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Wallet className="size-4" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            {activeCashRegister?.isOpen ? (
              <>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {formatMoney(activeCashRegister.currentBalanceCents ?? 0)}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0">
                    Aberto
                  </Badge>
                  <span className="text-xs text-muted-foreground">Troco: {formatMoney(activeCashRegister.initialBalanceCents ?? 0)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-xl font-semibold text-muted-foreground">Caixa Fechado</div>
                <p className="text-xs text-muted-foreground mt-1">Nenhum turno ativo no momento</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Checklist de Progresso da Loja (Se ainda não estiver 100%) */}
      {setupProgressPercentage < 100 && (
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="size-5 text-primary" aria-hidden />
                  Etapas para uma Loja de Sucesso
                </CardTitle>
                <CardDescription>
                  Conclua as configurações fundamentais para vender com segurança e agilidade.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs font-semibold">
                {setupProgressPercentage}% Concluído
              </Badge>
            </div>
            <Progress value={setupProgressPercentage} className="h-2 mt-3" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {setupChecklist.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/80 transition-colors hover:bg-card"
              >
                {item.completed ? (
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                </div>
                {!item.completed && (
                  <Button asChild variant="ghost" size="sm" className="shrink-0 text-xs">
                    <Link to={item.targetRoute as never}>
                      Configurar
                      <ArrowRight className="size-3.5 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Seção Operacional 1: Filas de Atendimento e Pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="size-5 text-primary" aria-hidden />
                  Filas Operacionais de Pedidos
                </CardTitle>
                <CardDescription>
                  Status e gargalos que exigem ação da sua equipe hoje.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/pedidos">Gerenciar Todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Aguardando Pagamento</span>
                  <Clock className="size-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">{ordersBreakdown.awaitingPayment}</div>
                <p className="text-xs text-muted-foreground">Pix ou boletos pendentes</p>
              </div>

              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Precisam Separar</span>
                  <Box className="size-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">{ordersBreakdown.needsSeparation}</div>
                <p className="text-xs text-muted-foreground">Pagos, aguardando embalagem</p>
              </div>

              <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Prontos / Enviados</span>
                  <Truck className="size-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">{ordersBreakdown.shippedOrReady}</div>
                <p className="text-xs text-muted-foreground">Em transporte ou retirada</p>
              </div>
            </div>

            {/* Carrinhos Abandonados e Clientes */}
            <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <ShoppingCart className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Carrinhos Abandonados (7d)</p>
                    <p className="text-lg font-bold text-foreground">{abandonedCartsCount}</p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link to="/admin/marketing/carrinhos">Recuperar →</Link>
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Novas Clientes (30d)</p>
                    <p className="text-lg font-bold text-foreground">{newCustomers30d}</p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link to="/admin/clientes">Ver Clientes →</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas de Estoque */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="size-5 text-amber-600" aria-hidden />
                Estoque Crítico
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/estoque">Ver Tudo</Link>
              </Button>
            </div>
            <CardDescription>Produtos que exigem reposição imediata.</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <EmptyState
                title="Estoque regular"
                description="Nenhum produto está com estoque igual ou inferior a 5 unidades no momento."
              />
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-card">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-semibold text-foreground truncate">{item.productTitle}</p>
                      <p className="text-[11px] text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <Badge variant={item.stockOnHand === 0 ? "destructive" : "outline"} className="shrink-0 text-xs font-medium">
                      {item.stockOnHand === 0 ? "Esgotado" : `${item.stockOnHand} un.`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-border pt-3">
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link to="/admin/estoque/movimentos">
                Registrar Entrada de Estoque
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Links de Atalhos Principais por Área */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Store className="size-4 text-primary" />
              Catálogo & Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <p>Gerencie produtos, categorias, variações de tamanho e imagens.</p>
          </CardContent>
          <CardFooter className="pt-2">
            <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs">
              <Link to="/admin/catalogo/produtos">
                Ir para Produtos
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              Frente de Loja & Caixa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <p>Controle abertura/fechamento de caixa, troco inicial e lançamentos.</p>
          </CardContent>
          <CardFooter className="pt-2">
            <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs">
              <Link to="/admin/caixa">
                Ir para o Caixa
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Clientes & Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <p>Ficha de clientes, histórico de compras, fiado/crédito e conversas.</p>
          </CardContent>
          <CardFooter className="pt-2">
            <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs">
              <Link to="/admin/clientes">
                Ir para CRM
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              Pagamentos & Fretes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <p>Configure regras de Pix, comprovantes manuais e tabelas de envio.</p>
          </CardContent>
          <CardFooter className="pt-2">
            <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs">
              <Link to="/admin/configuracoes/pagamentos">
                Ajustar Pagamentos
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

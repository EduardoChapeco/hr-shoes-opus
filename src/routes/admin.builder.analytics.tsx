import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, MousePointerClick, Percent, BarChart3, ArrowLeft, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBuilderAnalyticsSummary } from "@/services/telemetry.functions";

export const Route = createFileRoute("/admin/builder/analytics")({
  head: () => ({ meta: [{ title: "Métricas do Builder — Hr Shoes" }] }),
  loader: async () => {
    const res = await getBuilderAnalyticsSummary();
    if (res.status === "error") {
      throw new Error(res.message || "Erro ao carregar métricas do Builder");
    }
    return {
      summary: res.data || { totalViews: 0, totalClicks: 0, blockStats: [] },
    };
  },
  component: BuilderAnalyticsPage,
});

function BuilderAnalyticsPage() {
  const { summary } = Route.useLoaderData();
  const { totalViews, totalClicks, blockStats = [] } = summary;

  const averageCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/builder">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Builder
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Desempenho Comercial"
        title="Métricas do Builder Platform"
        description="Acompanhe o engajamento, visualizações e cliques das seções criadas no editor da Hr Shoes."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Visualizações Totais
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <Eye className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {totalViews.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Impressões de blocos nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cliques Totais
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <MousePointerClick className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {totalClicks.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cliques em CTAs e links nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card to-card/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              CTR Médio Geral
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
              <Percent className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {averageCtr}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de cliques em relação às visualizações
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              Engajamento por Tipo de Bloco
            </CardTitle>
            <CardDescription>
              Comparativo de visualizações vs. cliques por bloco dinâmico nos últimos 30 dias.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {blockStats.length === 0 ? (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Sem dados de eventos para exibir gráficos.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={blockStats} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="block_type" className="fill-muted-foreground text-xs" />
                  <YAxis className="fill-muted-foreground text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="views" name="Visualizações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" name="Cliques" fill="hsl(var(--chart-2, 210 100% 50%))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Detailed Table Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Ranking de CTR
            </CardTitle>
            <CardDescription>
              Ordenado pelos tipos de blocos com mais exibições.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Bloco</th>
                    <th className="px-4 py-3 font-semibold text-right">Views</th>
                    <th className="px-4 py-3 font-semibold text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {blockStats.map((stat: { block_type: string; views: number; clicks: number; ctr: number }, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">
                        {stat.block_type}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-muted-foreground">
                        {stat.views.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            stat.ctr > 5
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : stat.ctr > 2
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {stat.ctr}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {blockStats.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum bloco registrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

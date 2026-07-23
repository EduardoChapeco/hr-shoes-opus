import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  AlertTriangle,
  ArrowRight,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ErrorState } from "@/components/state/states";
import {
  getOnboardingStatus,
  type OnboardingOverview,
  type OnboardingStepStatus,
} from "@/services/onboarding.functions";

export const Route = createFileRoute("/admin/configuracoes/etapas")({
  head: () => ({ meta: [{ title: "Etapas para uma Loja de Sucesso — Hr Shoes" }] }),
  loader: async () => {
    return await getOnboardingStatus();
  },
  errorComponent: ({ error }) => <EtapasErrorState error={error} />,
  component: EtapasPage,
});

function EtapasErrorState({ error }: { error: Error }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configurações"
        title="Etapas para uma Loja de Sucesso"
        description="Checklist inteligente de prontidão comercial."
      />
      <ErrorState
        title="Erro ao carregar etapas de configuração"
        description={error.message || "Não foi possível verificar o estado das configurações."}
      />
    </div>
  );
}

function getStatusBadge(status: OnboardingStepStatus) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1">
          <CheckCircle2 className="size-3.5" /> Completo
        </Badge>
      );
    case "partially_configured":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs gap-1">
          <Clock className="size-3.5" /> Parcial
        </Badge>
      );
    case "locked":
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs gap-1">
          <Lock className="size-3.5" /> Bloqueado
        </Badge>
      );
    case "technical_error":
      return (
        <Badge variant="destructive" className="text-xs gap-1">
          <AlertTriangle className="size-3.5" /> Erro Técnico
        </Badge>
      );
    case "unconfigured":
    default:
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs gap-1">
          <Circle className="size-3.5" /> Não Configurado
        </Badge>
      );
  }
}

function EtapasPage() {
  const result = Route.useLoaderData();

  const {
    steps,
    totalSteps,
    completedSteps,
    partiallyConfiguredSteps,
    progressPercentage,
    isStoreReadyToSell,
  } = result;

  const categoryLabels: Record<string, string> = {
    fundamentos: "1. Fundamentos da Loja",
    catalogo: "2. Catálogo e Produtos",
    vendas: "3. Vendas e Operação",
    divulgacao: "4. Divulgação e Crescimento",
  };

  const groupedSteps = {
    fundamentos: steps.filter((s: any) => s.category === "fundamentos"),
    catalogo: steps.filter((s: any) => s.category === "catalogo"),
    vendas: steps.filter((s: any) => s.category === "vendas"),
    divulgacao: steps.filter((s: any) => s.category === "divulgacao"),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Configurações & Saúde da Loja"
        title="Etapas para uma Loja de Sucesso"
        description="Acompanhe o progresso real de configuração da sua loja. Complete as etapas para desbloquear o potencial máximo de vendas."
      />

      {/* Card de Status Geral */}
      <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Rocket className="size-6 text-primary" aria-hidden />
                {progressPercentage === 100
                  ? "Sua loja está 100% pronta!"
                  : isStoreReadyToSell
                  ? "Pronta para Vender! (Configurações adicionais pendentes)"
                  : "Configuração em Progresso"}
              </CardTitle>
              <CardDescription>
                {completedSteps} de {totalSteps} etapas concluídas com sucesso no banco de dados.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={progressPercentage === 100 ? "default" : "secondary"} className="text-sm px-3 py-1 font-bold">
                {progressPercentage}% Completo
              </Badge>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3 mt-4" />
        </CardHeader>
        <CardContent className="pt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-4 text-emerald-600" />
            Zero simulação — Todos os dados testam tabelas reais
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="size-4 text-primary" />
            Progresso salvo automaticamente por entidade
          </span>
        </CardContent>
      </Card>

      {/* Grupos de Etapas */}
      <div className="space-y-6">
        {(Object.keys(groupedSteps) as Array<keyof typeof groupedSteps>).map((groupKey) => (
          <Card key={groupKey}>
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base text-foreground font-semibold">
                {categoryLabels[groupKey]}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/50 p-0">
              {groupedSteps[groupKey].map((step: any) => (
                <div key={step.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground">{step.label}</h4>
                      {getStatusBadge(step.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    {step.details && (
                      <p className="text-[11px] text-muted-foreground/80 italic">{step.details}</p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {step.status !== "completed" ? (
                      <Button asChild variant={step.status === "locked" ? "outline" : "default"} size="sm" disabled={step.status === "locked"} className="text-xs">
                        <Link to={step.targetRoute as never}>
                          Configurar
                          <ArrowRight className="size-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                        <Link to={step.targetRoute as never}>
                          Revisar →
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Shield, CheckCircle2, AlertCircle, Info } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/configuracoes/lgpd")({
  head: () => ({ meta: [{ title: "LGPD — Hr Shoes" }] }),
  component: LgpdPage,
});

function LgpdPage() {
  const requirements = [
    {
      title: "Consentimento explícito",
      description:
        "O checkout coleta consentimento para uso de dados pessoais antes da finalização do pedido.",
      status: "ok",
    },
    {
      title: "Política de Privacidade pública",
      description: "A loja exibe a política de privacidade na vitrine em /privacidade e no footer.",
      status: "ok",
    },
    {
      title: "Direito de acesso aos dados",
      description: "A cliente pode acessar seus dados pessoais através do painel /conta/perfil.",
      status: "ok",
    },
    {
      title: "Direito à exclusão",
      description:
        "Solicitações de exclusão de conta devem ser tratadas manualmente via contato. Automatização prevista para Fase 5.",
      status: "partial",
    },
    {
      title: "Minimização de dados",
      description:
        "O sistema coleta apenas nome, e-mail, endereço e histórico de pedidos — dados estritamente necessários.",
      status: "ok",
    },
    {
      title: "Proteção de dados (RLS)",
      description:
        "Row Level Security habilitado no Supabase garante que clientes acessem apenas seus próprios dados.",
      status: "ok",
    },
    {
      title: "Registro de atividades",
      description:
        "Log de auditoria de ações administrativas está disponível em /admin/configuracoes/auditoria.",
      status: "ok",
    },
    {
      title: "Encarregado de Dados (DPO)",
      description:
        "A loja deve indicar um encarregado de dados (DPO) e disponibilizar canal de contato.",
      status: "attention",
    },
  ];

  const statusConfig = {
    ok: {
      icon: CheckCircle2,
      color: "text-green-600",
      badge: "default" as const,
      label: "Conforme",
    },
    partial: {
      icon: AlertCircle,
      color: "text-yellow-600",
      badge: "secondary" as const,
      label: "Parcial",
    },
    attention: {
      icon: Info,
      color: "text-blue-600",
      badge: "outline" as const,
      label: "Atenção",
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conformidade LGPD"
        description="Checklist de adequação da plataforma à Lei Geral de Proteção de Dados (Lei 13.709/2018)."
      />

      <div className="rounded-lg border bg-card p-5 flex items-start gap-3">
        <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Esta página apresenta o status de conformidade da plataforma com os requisitos da LGPD. Os
          itens marcados como "Atenção" ou "Parcial" requerem ação do operador da loja.
        </p>
      </div>

      <div className="space-y-3">
        {requirements.map((req, i) => {
          const cfg = statusConfig[req.status as keyof typeof statusConfig];
          const Icon = cfg.icon;
          return (
            <div key={i} className="rounded-lg border bg-card p-4 flex items-start gap-4">
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${cfg.color}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{req.title}</p>
                  <Badge variant={cfg.badge}>{cfg.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{req.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

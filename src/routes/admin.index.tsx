import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, ShoppingCart, Boxes, Users, ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Painel — Hr Shoes" }] }),
  component: Dashboard,
});

const METRICS = [
  { label: "Produtos publicados", icon: Package, phase: "Fase 1" },
  { label: "Pedidos", icon: ShoppingCart, phase: "Fase 2" },
  { label: "Estoque monitorado", icon: Boxes, phase: "Fase 1" },
  { label: "Clientes", icon: Users, phase: "Fase 4" },
];

function Dashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Painel"
        title="Visão geral"
        description="Bem-vinda ao painel da Hr Shoes. Comece pelo onboarding para configurar sua loja."
        actions={
          <Button asChild>
            <Link to="/admin/onboarding">
              Começar
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {METRICS.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <m.icon className="size-5 text-primary" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-foreground">{m.label}</p>
              <Badge variant="secondary" className="mt-2 text-badge">
                {m.phase}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração da loja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            O sistema está na Fase 0 (fundação). Métricas, catálogo e pedidos reais serão ativados
            nas próximas fases — nenhum dado é simulado.
          </p>
          <Button variant="outline" asChild>
            <Link to="/admin/configuracoes/loja">Dados da loja</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

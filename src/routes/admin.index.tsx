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

const QUICK_LINKS = [
  { label: "Produtos", icon: Package, to: "/admin/catalogo/produtos" },
  { label: "Pedidos", icon: ShoppingCart, to: "/admin/pedidos" },
  { label: "Estoque", icon: Boxes, to: "/admin/estoque" },
  { label: "Clientes", icon: Users, to: "/admin/clientes" },
];

function Dashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Painel"
        title="Visão geral"
        description="Bem-vinda ao painel da Hr Shoes. Acesse os módulos abaixo ou veja os relatórios."
        actions={
          <Button asChild>
            <Link to="/admin/relatorios">
              Ver relatórios
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {QUICK_LINKS.map((m) => (
          <Card key={m.label} className="hover:shadow-md transition-shadow">
            <Link to={m.to as never}>
              <CardHeader className="pb-2">
                <m.icon className="size-5 text-primary" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-1">Ver →</p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/admin/configuracoes/loja">Dados da Loja</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/admin/configuracoes/seo">SEO</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/admin/caixa">Caixa</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/admin/relatorios">Relatórios</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pós-venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/admin/pedidos/trocas">Trocas e Devoluções</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/admin/clientes">CRM</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — Hr Shoes" }] }),
  component: Onboarding,
});

const STEPS = [
  {
    title: "Configure os dados da loja",
    desc: "Nome, CNPJ, contato e endereço.",
    done: false,
    link: "/admin/configuracoes/loja",
    linkLabel: "Dados da Loja",
  },
  {
    title: "Defina a identidade visual",
    desc: "Logo, cores e tipografia (via Design System).",
    done: true,
    link: "/admin/configuracoes/seo",
    linkLabel: "SEO e Metadados",
  },
  {
    title: "Cadastre produtos e variações",
    desc: "Crie o catálogo com tipos, atributos e estoque.",
    done: false,
    link: "/admin/catalogo/produtos",
    linkLabel: "Catálogo",
  },
  {
    title: "Configure fretes",
    desc: "Defina zonas de entrega e taxas de frete.",
    done: false,
    link: "/admin/fretes/tabelas",
    linkLabel: "Tabelas de Frete",
  },
  {
    title: "Configure pagamentos",
    desc: "Ative os métodos de pagamento da loja.",
    done: false,
    link: "/admin/pagamentos",
    linkLabel: "Pagamentos",
  },
  {
    title: "Publique e configure o CMS",
    desc: "Monte a vitrine com blocos de conteúdo dinâmicos.",
    done: false,
    link: "/admin/cms/paginas",
    linkLabel: "CMS Páginas",
  },
];

function Onboarding() {
  const completedCount = STEPS.filter((s) => s.done).length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Primeiros passos"
        title="Onboarding"
        description="Um roteiro claro para colocar a Hr Shoes no ar. Siga as etapas abaixo."
      />

      <div className="rounded-lg border bg-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">
            {completedCount}/{STEPS.length} etapas
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {STEPS.map((s) => (
          <Card key={s.title}>
            <CardContent className="flex items-start gap-4 py-4">
              {s.done ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={s.link as never}>
                  {s.linkLabel}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

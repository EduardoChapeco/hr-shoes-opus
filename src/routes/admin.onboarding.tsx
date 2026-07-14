import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — Hr Shoes" }] }),
  component: Onboarding,
});

const STEPS = [
  { title: "Dados da loja", desc: "Nome, contato e endereço.", phase: "Fase 0", done: false },
  { title: "Identidade visual", desc: "Logo, cores e tipografia.", phase: "Fase 0", done: true },
  {
    title: "Catálogo e tipos",
    desc: "Cadastre produtos e variações.",
    phase: "Fase 1",
    done: false,
  },
  { title: "Estoque", desc: "Controle por variação e local.", phase: "Fase 1", done: false },
  {
    title: "Frete e pagamentos",
    desc: "Retirada, tabelas e cotação.",
    phase: "Fase 2",
    done: false,
  },
  { title: "Publicação", desc: "Vitrine, páginas e SEO.", phase: "Fase 3", done: false },
];

function Onboarding() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Primeiros passos"
        title="Onboarding"
        description="Um roteiro claro para colocar a Hr Shoes no ar, fase a fase."
      />
      <div className="space-y-3">
        {STEPS.map((s) => (
          <Card key={s.title}>
            <CardContent className="flex items-start gap-4 py-4">
              {s.done ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <Badge variant="secondary" className="text-[0.6rem]">
                    {s.phase}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

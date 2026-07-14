import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/trocas-e-devolucoes")({
  head: () => ({ meta: [{ title: "Trocas e devoluções — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Documento" title="Trocas e devoluções" />
      <div className="mt-8">
        <EmptyState
          title="Documento em preparação"
          description="A loja publicará este documento oficial em breve. Nenhum texto legal é exibido antes da versão oficial ser aprovada."
        />
      </div>
    </div>
  );
}

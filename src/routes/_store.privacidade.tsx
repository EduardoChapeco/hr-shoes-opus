import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/privacidade")({
  head: () => ({ meta: [{ title: "Política de privacidade — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Documento" title="Política de privacidade" />
      <div className="mt-8">
        <EmptyState
          title="Documento em preparação"
          description="A loja publicará este documento oficial em breve. Nenhum texto legal é exibido antes da versão oficial ser aprovada."
        />
      </div>
    </div>
  );
}

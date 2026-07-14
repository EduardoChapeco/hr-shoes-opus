import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/checkout/identificacao")({
  head: () => ({ meta: [{ title: "Identificação — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Checkout" title="Identificação" description="Etapa 1 de 5." />
      <div className="mt-8">
        <EmptyState title="Nenhum item para finalizar" description="Adicione produtos ao carrinho para iniciar o checkout." />
      </div>
    </div>
  );
}

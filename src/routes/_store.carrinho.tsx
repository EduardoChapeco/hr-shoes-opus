import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Compra" title="Carrinho" description="Itens no seu carrinho." />
      <div className="mt-8">
        <EmptyState title="Seu carrinho está vazio" description="Adicione produtos ao carrinho para continuar a compra." />
      </div>
    </div>
  );
}

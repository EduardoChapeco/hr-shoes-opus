import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/buscar")({
  head: () => ({ meta: [{ title: "Buscar — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Vitrine" title="Buscar" description="Encontre produtos na loja." />
      <div className="mt-8">
        <EmptyState title="A busca estará disponível em breve" description="O catálogo de produtos será ativado na próxima fase da loja." />
      </div>
    </div>
  );
}

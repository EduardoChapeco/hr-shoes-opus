import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/pedido/$publicToken/confirmacao")({
  component: Page,
});

function Page() {
  const { publicToken } = Route.useParams();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Pedido" title="Confirmação" description={`Pedido: ${publicToken}`} />
      <div className="mt-8">
        <EmptyState title="Pedido não encontrado" description="A confirmação de pedidos será ativada com o checkout, na próxima fase." />
      </div>
    </div>
  );
}

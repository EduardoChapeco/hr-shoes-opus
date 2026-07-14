import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/pedidos")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Pedidos</h2>
      <div className="mt-6">
        <EmptyState title="Nenhum pedido ainda" description="Seus pedidos aparecerão aqui após a primeira compra." />
      </div>
    </section>
  );
}

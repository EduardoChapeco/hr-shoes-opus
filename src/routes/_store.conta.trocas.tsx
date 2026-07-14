import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/trocas")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Trocas</h2>
      <div className="mt-6">
        <EmptyState title="Nenhuma solicitação" description="Suas solicitações de troca e devolução aparecerão aqui." />
      </div>
    </section>
  );
}

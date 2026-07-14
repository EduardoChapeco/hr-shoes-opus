import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Visão geral</h2>
      <div className="mt-6">
        <EmptyState
          title="Sua conta está pronta"
          description="O histórico de pedidos, créditos e mensagens aparecerá aqui após a ativação da área da cliente."
        />
      </div>
    </section>
  );
}

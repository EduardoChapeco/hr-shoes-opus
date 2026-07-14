import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/avaliacoes")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Avaliações</h2>
      <div className="mt-6">
        <EmptyState
          title="Nenhuma avaliação"
          description="Suas avaliações de produtos aparecerão aqui."
        />
      </div>
    </section>
  );
}

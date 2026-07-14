import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/creditos")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Créditos</h2>
      <div className="mt-6">
        <EmptyState
          title="Sem créditos"
          description="Seu saldo de créditos aparecerá aqui quando disponível."
        />
      </div>
    </section>
  );
}

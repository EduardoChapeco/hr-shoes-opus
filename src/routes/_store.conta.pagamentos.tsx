import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/pagamentos")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Pagamentos</h2>
      <div className="mt-6">
        <EmptyState title="Nenhum pagamento" description="Seus pagamentos aparecerão aqui em breve." />
      </div>
    </section>
  );
}

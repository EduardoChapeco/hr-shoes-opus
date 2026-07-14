import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/suporte")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Suporte</h2>
      <div className="mt-6">
        <EmptyState title="Nenhuma conversa" description="O atendimento com a loja será ativado em breve." />
      </div>
    </section>
  );
}

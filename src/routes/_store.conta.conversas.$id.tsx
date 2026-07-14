import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/conversas/$id")({
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Conversa</h2>
      <p className="mt-1 text-sm text-muted-foreground">Identificador: {id}</p>
      <div className="mt-6">
        <EmptyState
          title="Conversa indisponível"
          description="O chat com a loja será ativado em uma próxima fase."
        />
      </div>
    </section>
  );
}

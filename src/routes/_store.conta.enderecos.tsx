import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/enderecos")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Endereços</h2>
      <div className="mt-6">
        <EmptyState title="Nenhum endereço salvo" description="Você poderá cadastrar endereços de entrega em breve." />
      </div>
    </section>
  );
}

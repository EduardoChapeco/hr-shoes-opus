import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/gift-cards")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Gift cards</h2>
      <div className="mt-6">
        <EmptyState title="Nenhum gift card" description="Seus gift cards aparecerão aqui quando disponíveis." />
      </div>
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/privacidade")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Privacidade</h2>
      <div className="mt-6">
        <EmptyState
          title="Consentimentos"
          description="O gerenciamento de consentimentos (LGPD) será ativado em breve."
        />
      </div>
    </section>
  );
}

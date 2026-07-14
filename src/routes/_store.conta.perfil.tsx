import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/perfil")({
  component: Page,
});

function Page() {
  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground">Perfil</h2>
      <div className="mt-6">
        <EmptyState title="Perfil em breve" description="Você poderá editar seus dados pessoais quando a área da cliente for ativada." />
      </div>
    </section>
  );
}

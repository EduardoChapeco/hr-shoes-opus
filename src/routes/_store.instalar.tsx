import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/instalar")({
  head: () => ({ meta: [{ title: "Instalar o app — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="PWA" title="Instalar o app" description="Instale a loja no seu celular." />
      <div className="mt-8">
        <EmptyState title="Instalação em breve" description="O aplicativo instalável (PWA) será disponibilizado em uma próxima fase." />
      </div>
    </div>
  );
}

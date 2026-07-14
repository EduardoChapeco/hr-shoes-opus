import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/perfil-da-loja")({
  head: () => ({ meta: [{ title: "Perfil da loja — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="A loja" title="Perfil da loja" description="Conheça a Hr Shoes." />
      <div className="mt-8">
        <EmptyState
          title="Perfil em preparação"
          description="A loja poderá publicar aqui sua bio, endereço, horários e políticas."
        />
      </div>
    </div>
  );
}

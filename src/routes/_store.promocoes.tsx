import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/promocoes")({
  head: () => ({ meta: [{ title: "Promoções — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Ofertas" title="Promoções" description="Ofertas ativas da loja." />
      <div className="mt-8">
        <EmptyState title="Nenhuma promoção ativa" description="As promoções configuradas pela loja aparecerão aqui." />
      </div>
    </div>
  );
}

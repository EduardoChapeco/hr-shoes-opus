import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Vitrine" title="Catálogo" description="Todos os produtos da Hr Shoes." />
      <div className="mt-8">
        <EmptyState title="Ainda não há produtos publicados" description="Assim que a loja publicar produtos, o catálogo aparecerá aqui." />
      </div>
    </div>
  );
}

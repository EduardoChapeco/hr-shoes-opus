import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState, UnconfiguredState } from "@/components/state/states";
import { listPublishedProducts } from "@/services/catalog.functions";

export const Route = createFileRoute("/_store/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo — Hr Shoes" }] }),
  loader: () => listPublishedProducts(),
  component: Page,
});

function Page() {
  const result = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader
        eyebrow="Vitrine"
        title="Catálogo"
        description="Todos os produtos da Hr Shoes."
      />
      <div className="mt-8">
        {result.status === "unconfigured" ? (
          <UnconfiguredState
            title="Catálogo ainda não disponível"
            description={result.reason}
          />
        ) : (
          <EmptyState
            title="Ainda não há produtos publicados"
            description="Assim que a loja publicar produtos, o catálogo aparecerá aqui."
          />
        )}
      </div>
    </div>
  );
}

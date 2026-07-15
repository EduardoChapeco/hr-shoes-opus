import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";
import { ProductGrid } from "@/components/commerce/product-grid";
import { getPromotionalProducts } from "@/services/catalog.functions";

export const Route = createFileRoute("/_store/promocoes")({
  head: () => ({ meta: [{ title: "Promoções — Hr Shoes" }] }),
  loader: async () => {
    const res = await getPromotionalProducts();
    if (res.status === "error") throw new Error(res.message);
    return res;
  },
  component: Page,
});

function Page() {
  const result = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Ofertas" title="Promoções" description="Ofertas ativas da loja." />
      <div className="mt-8">
        {result.status === "ok" && result.data && result.data.length > 0 ? (
          <ProductGrid result={result} />
        ) : (
          <EmptyState
            title="Nenhuma promoção ativa"
            description="As promoções configuradas pela loja aparecerão aqui."
          />
        )}
      </div>
    </div>
  );
}

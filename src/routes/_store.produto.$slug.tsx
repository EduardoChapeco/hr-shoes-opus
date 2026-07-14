import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/produto/$slug")({
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Vitrine" title="Produto" description={`Identificador: ${slug}`} />
      <div className="mt-8">
        <EmptyState title="Produto indisponível" description="As páginas de produto serão ativadas com o catálogo, na próxima fase." />
      </div>
    </div>
  );
}

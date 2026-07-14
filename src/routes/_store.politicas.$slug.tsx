import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/politicas/$slug")({
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Vitrine" title="Política" description={`Identificador: ${slug}`} />
      <div className="mt-8">
        <EmptyState title="Documento em preparação" description="A loja publicará este documento em breve." />
      </div>
    </div>
  );
}

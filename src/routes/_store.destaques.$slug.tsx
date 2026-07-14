import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/destaques/$slug")({
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Vitrine" title="Destaque" description={`Identificador: ${slug}`} />
      <div className="mt-8">
        <EmptyState title="Destaque em preparação" description="Os destaques permanentes serão publicados pela loja." />
      </div>
    </div>
  );
}

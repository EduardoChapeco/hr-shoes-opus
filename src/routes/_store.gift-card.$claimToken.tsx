import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/gift-card/$claimToken")({
  component: Page,
});

function Page() {
  const { claimToken } = Route.useParams();
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader
        eyebrow="Vitrine"
        title="Gift Card"
        description={`Identificador: ${claimToken}`}
      />
      <div className="mt-8">
        <EmptyState
          title="Resgate de gift card"
          description="O resgate de gift cards será ativado em uma próxima fase."
        />
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/links")({
  head: () => ({ meta: [{ title: "Links — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Hr Shoes" title="Links" description="Links úteis da loja." />
      <div className="mt-8">
        <EmptyState
          title="Nenhum link publicado"
          description="A loja poderá configurar seu link da bio nesta página."
        />
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/stories")({
  head: () => ({ meta: [{ title: "Stories — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Conteúdo" title="Stories" description="Conteúdos em stories da loja." />
      <div className="mt-8">
        <EmptyState title="Nenhum story no momento" description="Os stories publicados pela loja aparecerão aqui." />
      </div>
    </div>
  );
}

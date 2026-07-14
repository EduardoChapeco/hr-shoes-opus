import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/faq")({
  head: () => ({ meta: [{ title: "Perguntas frequentes — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader
        eyebrow="Ajuda"
        title="Perguntas frequentes"
        description="Dúvidas comuns sobre a loja."
      />
      <div className="mt-8">
        <EmptyState
          title="Nenhuma pergunta publicada"
          description="A loja poderá publicar aqui as dúvidas mais frequentes."
        />
      </div>
    </div>
  );
}

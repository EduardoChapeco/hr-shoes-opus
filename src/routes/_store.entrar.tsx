import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/entrar")({
  head: () => ({ meta: [{ title: "Entrar — Hr Shoes" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 md:py-16">
      <PageHeader title="Entrar" description="Acesse sua conta Hr Shoes." />
      <div className="mt-8">
        <EmptyState title="Login em breve" description="A autenticação de clientes será ativada na próxima fase (banco de dados e Auth)." />
      </div>
    </div>
  );
}

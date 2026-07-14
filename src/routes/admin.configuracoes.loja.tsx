import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { UnconfiguredState } from "@/components/state/states";

export const Route = createFileRoute("/admin/configuracoes/loja")({
  head: () => ({ meta: [{ title: "Loja — Hr Shoes" }] }),
  component: StoreSettings,
});

function StoreSettings() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Configurações"
        title="Dados da loja"
        description="Nome, contato, endereço e identidade da Hr Shoes."
      />
      <UnconfiguredState
        title="Configuração da loja"
        description="Os dados da loja serão gravados com segurança pela camada de serviços quando o banco de dados for ativado (Fase 1). Nenhum dado é salvo diretamente pelo navegador."
      />
    </div>
  );
}

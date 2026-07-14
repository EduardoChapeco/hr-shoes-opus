import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/catalogo/produtos/novo")({
  head: () => ({ meta: [{ title: "Novo produto — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Novo produto" description="Formulário adaptativo por tipo de produto." />
  ),
});

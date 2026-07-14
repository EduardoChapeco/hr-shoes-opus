import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/catalogo/produtos/$id")({
  head: () => ({ meta: [{ title: "Editar produto — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Editar produto" description="Edição de produto e matriz de variantes." />
  ),
});

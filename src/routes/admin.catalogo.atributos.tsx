import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/catalogo/atributos")({
  head: () => ({ meta: [{ title: "Atributos — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Atributos" description="Definições de atributos reutilizáveis." />
  ),
});

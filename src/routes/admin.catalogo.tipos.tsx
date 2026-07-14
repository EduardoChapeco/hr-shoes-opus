import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/catalogo/tipos")({
  head: () => ({ meta: [{ title: "Tipos de produto — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Tipos de produto" description="Schemas de atributos versionados por tipo." />
  ),
});

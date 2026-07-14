import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/fretes/tabelas")({
  head: () => ({ meta: [{ title: "Tabelas de frete — Hr Shoes" }] }),
  component: () => (
    <PhaseGate
      phase={2}
      title="Tabelas de frete"
      description="Frete manual por região, CEP e peso."
    />
  ),
});

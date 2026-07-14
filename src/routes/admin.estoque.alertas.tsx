import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/estoque/alertas")({
  head: () => ({ meta: [{ title: "Alertas de estoque — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Alertas de estoque" description="Alertas de baixo estoque." />
  ),
});

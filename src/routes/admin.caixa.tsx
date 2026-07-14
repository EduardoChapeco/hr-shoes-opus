import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/caixa")({
  head: () => ({ meta: [{ title: "Caixa — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={4} title="Caixa" description="Frente de caixa e turnos." />
  ),
});

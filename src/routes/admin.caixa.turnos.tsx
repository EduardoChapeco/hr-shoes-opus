import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/caixa/turnos")({
  head: () => ({ meta: [{ title: "Turnos de caixa — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={4} title="Turnos de caixa" description="Abertura e fechamento de turnos." />
  ),
});

import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/estoque/movimentos")({
  head: () => ({ meta: [{ title: "Movimentos de estoque — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Movimentos de estoque" description="Ledger imutável de movimentos." />
  ),
});

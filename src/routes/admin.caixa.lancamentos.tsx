import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/caixa/lancamentos")({
  head: () => ({ meta: [{ title: "Lançamentos — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={4} title="Lançamentos" description="Entradas e saídas de caixa." />
  ),
});

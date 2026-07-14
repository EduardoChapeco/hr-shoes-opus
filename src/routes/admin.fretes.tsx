import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/fretes")({
  head: () => ({ meta: [{ title: "Fretes — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={2} title="Fretes" description="Estratégias de frete configuráveis." />
  ),
});

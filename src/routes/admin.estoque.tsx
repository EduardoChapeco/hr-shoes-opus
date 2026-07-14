import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/estoque")({
  head: () => ({ meta: [{ title: "Estoque — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Estoque" description="Estoque por variação e local." />
  ),
});

import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/trocas")({
  head: () => ({ meta: [{ title: "Trocas — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={4} title="Trocas" description="Trocas e devoluções." />
  ),
});

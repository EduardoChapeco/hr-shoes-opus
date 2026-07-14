import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliações — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={3} title="Avaliações" description="Moderação de avaliações." />
  ),
});

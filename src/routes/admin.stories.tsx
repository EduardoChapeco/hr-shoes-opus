import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/stories")({
  head: () => ({ meta: [{ title: "Stories — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={3} title="Stories" description="Gestão de stories e destaques." />
  ),
});

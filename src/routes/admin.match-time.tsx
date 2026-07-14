import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/match-time")({
  head: () => ({ meta: [{ title: "Match Time — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={5} title="Match Time" description="Recomendação por swipe explicável." />
  ),
});

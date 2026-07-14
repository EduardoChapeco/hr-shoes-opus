import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/marketing/feed")({
  head: () => ({ meta: [{ title: "Feeds — Hr Shoes" }] }),
  component: () => <PhaseGate phase={5} title="Feeds" description="Feeds Meta e Google." />,
});

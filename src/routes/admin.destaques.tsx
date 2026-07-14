import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/destaques")({
  head: () => ({ meta: [{ title: "Destaques — Hr Shoes" }] }),
  component: () => <PhaseGate phase={3} title="Destaques" description="Destaques permanentes." />,
});

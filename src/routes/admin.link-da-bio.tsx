import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/link-da-bio")({
  head: () => ({ meta: [{ title: "Link da bio — Hr Shoes" }] }),
  component: () => <PhaseGate phase={3} title="Link da bio" description="Página de links." />,
});

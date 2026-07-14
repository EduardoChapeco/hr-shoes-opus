import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/comissoes")({
  head: () => ({ meta: [{ title: "Comissões — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={4} title="Comissões" description="Comissões versionadas server-side." />
  ),
});

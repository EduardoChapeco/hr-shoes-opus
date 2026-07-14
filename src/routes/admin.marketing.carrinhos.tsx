import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/marketing/carrinhos")({
  head: () => ({ meta: [{ title: "Carrinhos abandonados — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={5} title="Carrinhos abandonados" description="Recuperação com consentimento." />
  ),
});

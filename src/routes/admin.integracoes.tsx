import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/integracoes")({
  head: () => ({ meta: [{ title: "Integrações — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={5} title="Integrações" description="Conexões externas com status." />
  ),
});

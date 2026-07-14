import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/comprovantes")({
  head: () => ({ meta: [{ title: "Comprovantes — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={2} title="Comprovantes" description="Análise de comprovantes manuais." />
  ),
});

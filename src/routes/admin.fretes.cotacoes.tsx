import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/fretes/cotacoes")({
  head: () => ({ meta: [{ title: "Cotações — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={2} title="Cotações" description="Cotações manuais de frete." />
  ),
});

import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/marketing/cupons")({
  head: () => ({ meta: [{ title: "Cupons — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={5} title="Cupons" description="Cupons com regras server-side." />
  ),
});

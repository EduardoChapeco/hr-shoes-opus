import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={2} title="Pagamentos" description="Pagamentos e tentativas por provedor." />
  ),
});

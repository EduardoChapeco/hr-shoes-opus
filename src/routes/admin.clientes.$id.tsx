import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={4} title="Cliente" description="Ficha completa da cliente." />
  ),
});

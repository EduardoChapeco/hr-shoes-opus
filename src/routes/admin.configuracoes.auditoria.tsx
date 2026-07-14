import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/configuracoes/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={4} title="Auditoria" description="Log de auditoria append-only." />
  ),
});

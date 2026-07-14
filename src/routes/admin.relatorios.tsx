import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Hr Shoes" }] }),
  component: () => <PhaseGate phase={4} title="Relatórios" description="Relatórios e métricas." />,
});

import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/suporte")({
  head: () => ({ meta: [{ title: "Suporte — Hr Shoes" }] }),
  component: () => <PhaseGate phase={4} title="Suporte" description="Atendimentos e SLA." />,
});

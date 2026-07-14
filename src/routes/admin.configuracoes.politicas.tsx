import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/configuracoes/politicas")({
  head: () => ({ meta: [{ title: "Políticas — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={3} title="Políticas" description="Políticas, termos e versões." />
  ),
});

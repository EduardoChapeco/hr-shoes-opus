import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/perfil-publico")({
  head: () => ({ meta: [{ title: "Perfil público — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={3} title="Perfil público" description="Portfólio público da loja." />
  ),
});

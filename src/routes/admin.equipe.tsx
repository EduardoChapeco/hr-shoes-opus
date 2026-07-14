import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/equipe")({
  head: () => ({ meta: [{ title: "Equipe — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Equipe" description="Usuários, papéis e permissões." />
  ),
});

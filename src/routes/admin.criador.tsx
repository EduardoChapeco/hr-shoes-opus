import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/criador")({
  head: () => ({ meta: [{ title: "Criador — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={5} title="Criador" description="Criador de artes e posts." />
  ),
});

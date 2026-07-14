import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={2} title="Pedidos" description="Gestão de pedidos com máquina de estado." />
  ),
});

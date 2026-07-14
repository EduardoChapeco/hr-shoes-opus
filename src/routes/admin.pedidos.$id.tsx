import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/pedidos/$id")({
  head: () => ({ meta: [{ title: "Pedido — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={2} title="Pedido" description="Detalhe do pedido e impressão." />
  ),
});

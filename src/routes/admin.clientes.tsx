import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={4} title="Clientes" description="Base de clientes e ficha 360." />
  ),
});

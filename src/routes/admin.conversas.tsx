import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/conversas")({
  head: () => ({ meta: [{ title: "Conversas — Hr Shoes" }] }),
  component: () => <PhaseGate phase={4} title="Conversas" description="Chat com clientes." />,
});

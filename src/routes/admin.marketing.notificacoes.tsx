import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/marketing/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Hr Shoes" }] }),
  component: () => <PhaseGate phase={5} title="Notificações" description="Web push e campanhas." />,
});

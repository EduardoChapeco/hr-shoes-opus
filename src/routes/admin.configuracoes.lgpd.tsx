import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/configuracoes/lgpd")({
  head: () => ({ meta: [{ title: "LGPD — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={3} title="LGPD" description="Consentimentos e privacidade." />
  ),
});

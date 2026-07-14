import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/marketing/gift-cards")({
  head: () => ({ meta: [{ title: "Gift cards — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={4} title="Gift cards" description="Gestão de gift cards." />
  ),
});

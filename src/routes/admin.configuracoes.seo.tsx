import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/configuracoes/seo")({
  head: () => ({ meta: [{ title: "SEO — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={3} title="SEO" description="Configurações de SEO." />
  ),
});

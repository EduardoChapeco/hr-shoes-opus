import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/cms/paginas")({
  head: () => ({ meta: [{ title: "Páginas — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={3} title="Páginas" description="Páginas dinâmicas do CMS." />
  ),
});

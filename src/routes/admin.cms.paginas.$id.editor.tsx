import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/cms/paginas/$id/editor")({
  head: () => ({ meta: [{ title: "Editor de página — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={3} title="Editor de página" description="Editor por seções pré-existentes." />
  ),
});

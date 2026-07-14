import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/catalogo/colecoes")({
  head: () => ({ meta: [{ title: "Coleções — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Coleções" description="Coleções curadas de produtos." />
  ),
});

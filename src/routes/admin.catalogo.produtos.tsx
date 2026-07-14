import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/catalogo/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Produtos" description="Lista e cadastro de produtos com tipos, variações, mídia e estoque." />
  ),
});

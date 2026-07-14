import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/catalogo/categorias")({
  head: () => ({ meta: [{ title: "Categorias — Hr Shoes" }] }),
  component: () => (
    <PhaseGate phase={1} title="Categorias" description="Árvore de categorias com SEO e filtros." />
  ),
});

import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/cms/navegacao")({
  head: () => ({ meta: [{ title: "Navegação — Hr Shoes" }] }),
  component: () => <PhaseGate phase={3} title="Navegação" description="Menus de navegação." />,
});

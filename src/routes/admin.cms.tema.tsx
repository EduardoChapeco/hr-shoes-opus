import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/cms/tema")({
  head: () => ({ meta: [{ title: "Tema — Hr Shoes" }] }),
  component: () => <PhaseGate phase={3} title="Tema" description="Editor de tema e identidade." />,
});

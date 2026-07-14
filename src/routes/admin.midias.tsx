import { createFileRoute } from "@tanstack/react-router";

import { PhaseGate } from "@/components/admin/phase-gate";

export const Route = createFileRoute("/admin/midias")({
  head: () => ({ meta: [{ title: "Mídias — Hr Shoes" }] }),
  component: () => (
    <PhaseGate
      phase={1}
      title="Mídias"
      description="Biblioteca de imagens e vídeos com derivados."
    />
  ),
});

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/estoque/alertas")({
  head: () => ({ meta: [{ title: "Alertas de estoque — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

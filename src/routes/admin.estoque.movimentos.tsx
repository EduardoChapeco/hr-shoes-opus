import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/estoque/movimentos")({
  head: () => ({ meta: [{ title: "Movimentos de estoque — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

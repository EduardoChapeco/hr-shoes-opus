import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/fretes/cotacoes")({
  head: () => ({ meta: [{ title: "Cotações — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

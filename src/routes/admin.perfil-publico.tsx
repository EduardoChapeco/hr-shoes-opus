import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/perfil-publico")({
  head: () => ({ meta: [{ title: "Perfil público — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

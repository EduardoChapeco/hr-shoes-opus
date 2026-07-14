import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/catalogo/produtos/$id")({
  head: () => ({ meta: [{ title: "Editar produto — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

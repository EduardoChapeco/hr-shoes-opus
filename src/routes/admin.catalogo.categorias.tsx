import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/catalogo/categorias")({
  head: () => ({ meta: [{ title: "Categorias — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

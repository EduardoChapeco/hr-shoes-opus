import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/configuracoes/politicas")({
  head: () => ({ meta: [{ title: "Políticas — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

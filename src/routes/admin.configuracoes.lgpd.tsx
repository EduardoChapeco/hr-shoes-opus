import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/configuracoes/lgpd")({
  head: () => ({ meta: [{ title: "LGPD — Hr Shoes" }] }),
  component: () => <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>,
});

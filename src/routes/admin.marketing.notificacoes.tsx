import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/marketing/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Hr Shoes" }] }),
  component: () => <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>,
});

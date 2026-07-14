import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/conversas")({
  head: () => ({ meta: [{ title: "Conversas — Hr Shoes" }] }),
  component: () => <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>,
});

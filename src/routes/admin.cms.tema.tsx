import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/cms/tema")({
  head: () => ({ meta: [{ title: "Tema — Hr Shoes" }] }),
  component: () => <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>,
});

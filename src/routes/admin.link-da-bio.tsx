import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/link-da-bio")({
  head: () => ({ meta: [{ title: "Link da bio — Hr Shoes" }] }),
  component: () => <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>,
});

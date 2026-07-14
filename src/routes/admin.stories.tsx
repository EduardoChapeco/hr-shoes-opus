import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/stories")({
  head: () => ({ meta: [{ title: "Stories — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

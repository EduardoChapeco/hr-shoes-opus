import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/match-time")({
  head: () => ({ meta: [{ title: "Match Time — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

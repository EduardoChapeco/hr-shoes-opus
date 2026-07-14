import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/comprovantes")({
  head: () => ({ meta: [{ title: "Comprovantes — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

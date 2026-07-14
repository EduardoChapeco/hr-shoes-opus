import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/marketing/cupons")({
  head: () => ({ meta: [{ title: "Cupons — Hr Shoes" }] }),
  component: () => (
    <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
  ),
});

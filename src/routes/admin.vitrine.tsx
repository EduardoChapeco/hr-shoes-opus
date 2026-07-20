import { createFileRoute, redirect } from "@tanstack/react-router";
import { getOrCreateHomeDocument } from "@/services/builder.functions";

export const Route = createFileRoute("/admin/vitrine")({
  loader: async () => {
    // getOrCreateHomeDocument finds or creates the home storefront document
    // (uses getExperienceDocument internally, no requirement for published status)
    const res = await getOrCreateHomeDocument();

    if (res.status === "success" && res.data?.id) {
      throw redirect({
        to: "/admin/builder/$documentId/editor",
        params: { documentId: res.data.id },
      });
    }

    throw new Error("Falha ao inicializar a vitrine principal.");
  },
  component: () => <div className="p-8 text-muted-foreground text-sm">Redirecionando para o construtor visual...</div>,
});

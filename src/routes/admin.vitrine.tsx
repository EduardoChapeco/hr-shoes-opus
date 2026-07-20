import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPublicExperienceDocumentBySlug, createExperienceDocument } from "@/services/builder.functions";

export const Route = createFileRoute("/admin/vitrine")({
  loader: async () => {
    // Busca a Home Page (Storefront) principal
    let res = await getPublicExperienceDocumentBySlug({ data: { slug: "home", document_type: "storefront" } });
    
    // Se não existir, criamos a semente inicial
    if (res.status === "error" || !res.data?.document) {
      const createRes = await createExperienceDocument({
        data: {
          title: "Página Inicial (Vitrine)",
          slug: "home",
          document_type: "storefront"
        }
      });
      if (createRes.status === "success") {
        throw redirect({
          to: "/admin/builder/$documentId/editor",
          params: { documentId: createRes.data.document.id }
        });
      } else {
        throw new Error("Falha ao inicializar a vitrine.");
      }
    }
    
    // Redireciona para o construtor visual
    throw redirect({
      to: "/admin/builder/$documentId/editor",
      params: { documentId: res.data.document.id }
    });
  },
  component: () => <div>Redirecionando para o construtor visual...</div>,
});

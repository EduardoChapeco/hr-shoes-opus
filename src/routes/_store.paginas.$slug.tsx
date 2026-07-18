import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";

export const Route = createFileRoute("/_store/paginas/$slug")({
  loader: async ({ params }) => {
    const res = await getPublicExperienceDocumentBySlug({ 
      data: { slug: params.slug, document_type: "storefront" } 
    });
    
    if (res.status === "not_found") throw notFound();
    if (res.status === "error" || res.status === "unconfigured") throw new Error(res.status);

    return {
      document: res.data.document,
      tree: res.data.tree,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData || !loaderData.document) return { meta: [{ title: "Página não encontrada" }] };
    return {
      meta: [
        { title: loaderData.document.seo_metadata?.title || `${loaderData.document.title} — Hr Shoes` },
        { name: "description", content: loaderData.document.seo_metadata?.description || "" },
      ],
    };
  },
  component: PublicPage,
});

function PublicPage() {
  const { document, tree } = Route.useLoaderData();

  if (!document) return null;

  return (
    <main className="w-full flex flex-col gap-0 min-h-screen">
      <ExperienceRenderer nodes={tree} />
    </main>
  );
}

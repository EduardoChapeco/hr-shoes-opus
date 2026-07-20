import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";

export const Route = createFileRoute("/_store/bio/$slug")({
  loader: async ({ params }) => {
    const res = await getPublicExperienceDocumentBySlug({ 
      data: { slug: params.slug, document_type: "biolink" } 
    });
    
    if (res.status === "not_found") throw notFound();
    if (res.status === "error" || res.status === "unconfigured") throw new Error(res.status);

    return {
      document: res.data.document,
      tree: res.data.tree,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData || !loaderData.document) return { meta: [{ title: "Biolink não encontrado" }] };
    return {
      meta: [
        { title: loaderData.document.seo_metadata?.title || `${loaderData.document.title}` },
        { name: "description", content: loaderData.document.seo_metadata?.description || "" },
      ],
    };
  },
  component: BiolinkPage,
});

function BiolinkPage() {
  const { document, tree } = Route.useLoaderData();

  if (!document) return null;

  return (
    <main className="w-full flex flex-col gap-0 min-h-screen bg-background">
      <ExperienceRenderer nodes={tree} />
    </main>
  );
}

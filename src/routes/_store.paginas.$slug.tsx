import { createFileRoute, notFound } from "@tanstack/react-router";

import { getPublicPageBySlug } from "@/services/cms.functions";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_store/paginas/$slug")({
  loader: async ({ params }) => {
    const res = await getPublicPageBySlug({ data: { slug: params.slug } });
    if (res.status === "not_found") throw notFound();
    if (res.status === "error" || res.status === "unconfigured") throw new Error(res.status);
    return res.data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Página não encontrada" }] };
    return {
      meta: [
        { title: loaderData.seo_title || `${loaderData.title} — Hr Shoes` },
        { name: "description", content: loaderData.seo_description || "" },
      ],
    };
  },
  component: PublicPage,
});

function PublicPage() {
  const page = Route.useLoaderData();

  return (
    <main className="w-full">
      {/* 
        This is a simple renderer. In a real scenario, this would map 
        over the sections and render specific components per type.
      */}
      {page.sections.map(
        (section: { id: string; section_type: string; content: Record<string, unknown> }) => (
          <section key={section.id} className="w-full">
            {section.section_type === "hero" && (
              <div
                className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center bg-muted"
                style={
                  section.content.bg_url
                    ? {
                        backgroundImage: `url(${section.content.bg_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              >
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 text-center space-y-4 px-4 text-white">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                    {String(section.content.title || "")}
                  </h1>
                  {Boolean(section.content.subtitle) && (
                    <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
                      {String(section.content.subtitle)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {section.section_type === "text" && (
              <div className="container py-12 md:py-16 max-w-4xl mx-auto prose dark:prose-invert">
                <p>{String(section.content.text || "")}</p>
              </div>
            )}

            {section.section_type === "spacer" && <div className="w-full h-16 md:h-32" />}

            {/* Additional block types can be added here */}
          </section>
        ),
      )}
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { getPageBySlug } from "@/services/cms.functions";
import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/politicas/$slug")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: (loaderData as any)?.title
          ? `${(loaderData as any).title} — Hr Shoes`
          : "Política — Hr Shoes",
      },
    ],
  }),
  loader: async ({ params }) => {
    const res = await getPageBySlug({ data: { slug: params.slug } });
    if (res && "status" in res && res.status === "not_found") return null as { title?: string; sections?: any[] } | null;
    return res as { title?: string; sections?: any[] } | null;
  },
  component: Page,
});

function Page() {
  const page = Route.useLoaderData() as { title?: string; sections?: any[] } | null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Documento" title={page?.title || "Política da Loja"} />
      <div className="mt-8">
        {!page ? (
          <EmptyState
            title="Página não encontrada"
            description="Este documento ainda não foi publicado."
          />
        ) : (
          <div className="prose prose-neutral max-w-none">
            {page.sections?.map((section) => (
              <div key={section.id}>
                {section.section_type === "text" && (
                  <div dangerouslySetInnerHTML={{ __html: section.content.html || "" }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

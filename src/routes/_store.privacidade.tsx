import { createFileRoute } from "@tanstack/react-router";
import { getPageBySlug } from "@/services/cms.functions";
import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/privacidade")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title
          ? `${loaderData.title} — Hr Shoes`
          : "Política de privacidade — Hr Shoes",
      },
    ],
  }),
  loader: async () => {
    const res = await getPageBySlug({ data: { slug: "privacidade" } });
    if (res && "status" in res && res.status === "not_found") return null;
    return res as { title?: string; sections?: any[] } | null;
  },
  component: Page,
});

function Page() {
  const page = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader eyebrow="Documento" title={page?.title || "Política de privacidade"} />
      <div className="mt-8">
        {!page ? (
          <EmptyState
            title="Página não encontrada"
            description="Este documento ainda não foi publicado."
          />
        ) : (
          <div className="prose prose-neutral max-w-none">
            {/* Aqui renderizaríamos as seções do construtor de página se existissem. Como é texto rico, vamos simplificar: */}
            {page.sections?.map((section: any) => (
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

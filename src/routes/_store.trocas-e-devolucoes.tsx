import { createFileRoute } from "@tanstack/react-router";
import { getPageBySlug } from "@/services/cms.functions";
import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/trocas-e-devolucoes")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData && !("status" in loaderData) && loaderData.title
          ? `${loaderData.title} — Hr Shoes`
          : "Trocas e Devoluções — Hr Shoes",
      },
    ],
  }),
  loader: async () => {
    const res = await getPageBySlug({ data: { slug: "trocas-e-devolucoes" } });
    if ("status" in res && res.status === "not_found") return null;
    return res;
  },
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  const res = data as any;

  if (!res || res.status === "not_found") {
    return (
      <div className="container py-20">
        <EmptyState
          title="Documento não encontrado"
          description="A política de trocas e devoluções ainda não foi publicada."
        />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PageHeader title={res.title} />
      <div className="container max-w-4xl mx-auto px-4 mt-12">
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary">
          {res.sections?.map((section: any) => (
            <div key={section.id}>
              {section.section_type === "text" && (
                <div dangerouslySetInnerHTML={{ __html: section.content.html || "" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";
import { getPublicFaqs } from "@/services/catalog.functions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/_store/faq")({
  head: () => ({ meta: [{ title: "Perguntas frequentes — Hr Shoes" }] }),
  loader: () => getPublicFaqs(),
  component: Page,
});

function Page() {
  const faqs = Route.useLoaderData() as Array<{
    question: string;
    answer: string;
    q?: string;
    a?: string;
  }>;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <PageHeader
        eyebrow="Ajuda"
        title="Perguntas Frequentes"
        description="Encontre respostas para as dúvidas mais comuns sobre compras, envios e trocas."
      />
      <div className="mt-8 max-w-3xl mx-auto">
        {!faqs || faqs.length === 0 ? (
          <EmptyState
            title="Nenhuma pergunta publicada"
            description="A loja poderá publicar aqui as dúvidas mais frequentes."
          />
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, i) => {
              const question = faq.question || faq.q || "Pergunta";
              const answer = faq.answer || faq.a || "";
              return (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border rounded-xl px-4 bg-card shadow-sm"
                >
                  <AccordionTrigger className="text-base font-medium py-4 hover:no-underline text-left">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}

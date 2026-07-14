import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareWarning, Link as LinkIcon, Mail, Phone } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";

export const Route = createFileRoute("/admin/suporte")({
  head: () => ({ meta: [{ title: "Suporte — Hr Shoes" }] }),
  component: SuportePage,
});

function SuportePage() {
  const faqs = [
    {
      q: "Como adicionar um produto?",
      a: "Acesse Catálogo → Produtos → Novo Produto. Preencha título, preço e status.",
    },
    {
      q: "Como abrir o caixa do dia?",
      a: "Acesse Caixa → Abrir Caixa. Informe o saldo inicial e clique em Abrir.",
    },
    {
      q: "Como processar uma devolução?",
      a: "Acesse Vendas → Trocas e Devoluções. Selecione a solicitação e clique em Aprovar → Confirmar Recebimento → Estornar.",
    },
    {
      q: "Como configurar frete?",
      a: "Acesse Vendas → Fretes → Tabelas. Crie zonas de entrega e adicione modalidades com valores.",
    },
    {
      q: "Como publicar uma página no site?",
      a: "Acesse Conteúdo → Páginas. Crie ou selecione uma página, adicione blocos no editor e clique em Publicar.",
    },
    {
      q: "Como ver o histórico do caixa?",
      a: "Acesse Caixa → Lançamentos para o caixa ativo, ou Caixa → Histórico para turnos anteriores.",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Suporte e Ajuda"
        description="Documentação rápida e canais de atendimento da plataforma Hr Shoes."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <a
          href="mailto:suporte@hrshoes.com.br"
          className="rounded-lg border bg-card p-5 flex items-start gap-4 hover:bg-accent transition-colors"
        >
          <Mail className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">E-mail</p>
            <p className="text-sm text-muted-foreground mt-1">suporte@hrshoes.com.br</p>
          </div>
        </a>
        <a
          href="https://wa.me/5549999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border bg-card p-5 flex items-start gap-4 hover:bg-accent transition-colors"
        >
          <Phone className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">WhatsApp</p>
            <p className="text-sm text-muted-foreground mt-1">(49) 9 9999-9999</p>
          </div>
        </a>
        <a
          href="https://docs.hrshoes.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border bg-card p-5 flex items-start gap-4 hover:bg-accent transition-colors"
        >
          <LinkIcon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Documentação</p>
            <p className="text-sm text-muted-foreground mt-1">docs.hrshoes.com.br</p>
          </div>
        </a>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5 text-muted-foreground" />
          Perguntas Frequentes
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="rounded-lg border bg-card">
              <summary className="cursor-pointer p-4 font-medium select-none hover:bg-muted/30 transition-colors rounded-lg">
                {faq.q}
              </summary>
              <p className="px-4 pb-4 pt-1 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

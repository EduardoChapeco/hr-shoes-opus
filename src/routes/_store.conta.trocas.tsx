import { createFileRoute, Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/states";
import { listCustomerExchanges } from "@/services/exchanges.functions";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_store/conta/trocas")({
  head: () => ({ meta: [{ title: "Trocas e Devoluções — Hr Shoes" }] }),
  loader: async () => {
    const res = await listCustomerExchanges();
    return res;
  },
  component: Page,
});

const STATUS_LABELS: Record<string, string> = {
  requested: "Solicitado",
  approved: "Aprovado",
  received: "Recebido",
  rejected: "Recusado",
  refunded: "Reembolsado",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  requested: "secondary",
  approved: "default",
  received: "default",
  rejected: "destructive",
  refunded: "outline",
};

function Page() {
  const exchanges = Route.useLoaderData();

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-editorial text-2xl text-foreground">Trocas e Devoluções</h2>
        <Button size="sm" asChild>
          <Link to="/conta/pedidos">
            <RefreshCw className="size-3.5 mr-1.5" aria-hidden />
            Solicitar via Pedido
          </Link>
        </Button>
      </div>

      {exchanges.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação"
          description="Suas solicitações de troca e devolução aparecem aqui. Para iniciar uma, acesse o detalhe do pedido."
          action={
            <Button asChild>
              <Link to="/conta/pedidos">Ver pedidos</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {exchanges.map((ex: any) => (
            <div key={ex.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Solicitado em{" "}
                    {new Date(ex.requestedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {ex.orderToken && (
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      Pedido <span className="text-primary">#{ex.orderToken}</span>
                    </p>
                  )}
                </div>
                <Badge variant={STATUS_VARIANTS[ex.status] ?? "secondary"}>
                  {STATUS_LABELS[ex.status] ?? ex.status}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{ex.reason}</p>
              {ex.orderTotal != null && (
                <p className="mt-2 text-sm font-medium text-foreground">
                  Valor: {formatMoney(ex.orderTotal)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/commerce/page-header";
import { ErrorState } from "@/components/state/states";
import { getOrderByToken } from "@/services/checkout.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/_store/pedido/$publicToken/confirmacao")({
  head: () => ({
    meta: [{ title: "Pedido Confirmado — Hr Shoes" }],
  }),
  loader: ({ params }) => getOrderByToken({ data: { token: params.publicToken } }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const order = Route.useLoaderData() as {
    id: string;
    public_token: string;
    items_snapshot: { productName: string; priceCents: number; quantity: number }[];
  } | null;

  if (!order) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-20 md:px-6">
        <ErrorState description="Pedido não encontrado." />
      </div>
    );
  }

  const totalCents =
    order.items_snapshot.reduce(
      (acc: number, item: { priceCents: number; quantity: number }) =>
        acc + item.priceCents * item.quantity,
      0,
    ) + 1500; // Adding flat shipping for display

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-10 text-primary" aria-hidden />
          </div>
          <PageHeader
            title="Pedido Confirmado!"
            description="Obrigado por comprar conosco. Recebemos seu pedido."
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Token do pedido:{" "}
            <span className="font-mono font-medium text-foreground">{order.public_token}</span>
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-secondary/50 px-6 py-4">
            <h2 className="flex items-center text-sm font-semibold text-foreground">
              <Package className="mr-2 size-4" /> Resumo da Compra
            </h2>
          </div>
          <div className="px-6 py-4">
            <ul className="divide-y divide-border">
              {order.items_snapshot.map(
                (
                  item: { productName: string; quantity: number; priceCents: number },
                  idx: number,
                ) => (
                  <li key={idx} className="flex justify-between py-3 text-sm">
                    <div className="flex items-center">
                      <span className="font-medium text-foreground">{item.quantity}x</span>
                      <span className="ml-3 text-muted-foreground">{item.productName}</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {formatMoney(item.priceCents * item.quantity)}
                    </span>
                  </li>
                ),
              )}
            </ul>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-base font-semibold">
              <span className="text-foreground">Total Pago</span>
              <span className="text-primary">{formatMoney(totalCents)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" variant="outline">
            <Link to="/conta/pedidos">Acompanhar Pedido</Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/catalogo">
              Continuar Comprando <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

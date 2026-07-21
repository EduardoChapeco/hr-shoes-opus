import { createFileRoute, Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/state/states";
import { listCustomerOrders } from "@/services/order.functions";

export const Route = createFileRoute("/_store/conta/pedidos/")({
  head: () => ({ meta: [{ title: "Meus Pedidos — Hr Shoes" }] }),
  loader: async () => {
    const res = await listCustomerOrders();
    return res;
  },
  component: Page,
});

function translateStatus(status: string) {
  const map: Record<string, string> = {
    draft: "Rascunho",
    awaiting_payment: "Aguardando Pagamento",
    paid: "Pago",
    processing: "Em Separação",
    ready_for_pickup: "Pronto para Retirada",
    shipped: "Enviado",
    delivered: "Entregue",
    completed: "Concluído",
    cancelled: "Cancelado",
    return_requested: "Devolução Solicitada",
    returned: "Devolvido",
  };
  return map[status] || status;
}

function Page() {
  const orders = Route.useLoaderData();

  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground mb-6">Histórico de Pedidos</h2>

      {orders.length === 0 ? (
        <EmptyState
          title="Nenhum pedido encontrado"
          description="Você ainda não realizou nenhuma compra na nossa loja."
          action={
            <Button asChild>
              <Link to="/catalogo">Ver produtos</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {orders.map((order: any) => (
            <div key={order.id} className="border rounded-lg overflow-hidden bg-card">
              <div className="bg-muted/40 p-4 border-b flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pedido realizado em</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">{formatMoney(order.total_cents)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pedido</p>
                  <p className="font-medium">#{order.public_token}</p>
                </div>
                <div className="flex-1 text-right">
                  <Badge variant="secondary" className="text-sm py-1">
                    {translateStatus(order.status)}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.product_title}</p>
                      <p className="text-sm text-muted-foreground">
                        Qtd: {item.quantity} | SKU: {item.variant_sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMoney(item.total_price_cents)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

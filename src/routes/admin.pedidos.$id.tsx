import { createFileRoute } from "@tanstack/react-start";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import { getServerClient } from "@/lib/supabase";

export const Route = createFileRoute("/admin/pedidos/$id")({
  head: () => ({ meta: [{ title: "Detalhes do Pedido — Hr Shoes" }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    const db = await getServerClient();
    const { data, error } = await db
      .from("orders")
      .select(
        `
        id, public_token, status, total_cents, subtotal_cents, shipping_cents,
        customer_snapshot, created_at, shipping_address,
        order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents )
      `,
      )
      .eq("id", params.id)
      .single();
    if (error) throw new Error("Pedido não encontrado");
    return data;
  },
  component: AdminOrderDetailPage,
});

function AdminOrderDetailPage() {
  const order = Route.useLoaderData();
  const date = new Date(order.created_at).toLocaleDateString("pt-BR");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendas"
        title={`Pedido #${order.public_token}`}
        description={`Realizado em ${date} por ${(order.customer_snapshot as any)?.name ?? "Desconhecido"}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-md border p-6 bg-card text-card-foreground">
            <h3 className="font-semibold text-lg mb-4">Itens do Pedido</h3>
            <div className="space-y-4">
              {order.order_items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{item.product_title}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.variant_sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatMoney(item.total_price_cents)}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x {formatMoney(item.unit_price_cents)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-md border p-6 bg-card text-card-foreground">
            <h3 className="font-semibold text-lg mb-4">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>{formatMoney(order.shipping_cents)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>Total</span>
                <span>{formatMoney(order.total_cents)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-md border p-6 bg-card text-card-foreground">
            <h3 className="font-semibold text-lg mb-4">Status</h3>
            <Badge variant="outline" className="text-lg py-1 px-3 mb-4 block text-center">
              {order.status}
            </Badge>

            {order.status === "payment_pending" && (
              <p className="text-sm text-muted-foreground text-center bg-muted p-3 rounded-md">
                Aguardando confirmação automática via Gateway (Pagar.me Webhook). Nenhuma ação manual é necessária.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

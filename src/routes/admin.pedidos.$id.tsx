import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from "react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Printer, Banknote, Landmark } from "lucide-react";
import { getServerClient } from "@/lib/supabase";
import { approvePayment, rejectPayment } from "@/services/payment.functions";
import { updateOrderStatus } from "@/services/order.functions";

export const Route = createFileRoute("/admin/pedidos/$id")({
  head: () => ({ meta: [{ title: "Detalhes do Pedido — Hr Shoes" }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    const db = await getServerClient();
    const { data, error } = await db
      .from("orders")
      .select(
        `
        id, public_token, status, total_cents, subtotal_cents, shipping_cents,
        customer_snapshot, created_at, shipping_method, shipping_address,
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
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const date = new Date(order.created_at).toLocaleDateString("pt-BR");

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await updateOrderStatus({ data: { orderId: order.id, status: newStatus as any } });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Status atualizado!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async (method: "cash" | "bank_transfer") => {
    setIsConfirming(true);
    try {
      const res = await approvePayment({ data: { orderId: order.id, receivedMethod: method } });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Pagamento confirmado. O pedido está agora em separação!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao aprovar");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Tem certeza que deseja cancelar esta venda por falta de pagamento?")) return;
    setIsRejecting(true);
    try {
      const res = await rejectPayment({ data: { orderId: order.id, reason: "Cancelado manualmente pela vendedora" } });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Pedido cancelado e pagamento rejeitado.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao cancelar");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <PageHeader
          eyebrow="Vendas"
          title={`Pedido #${order.public_token}`}
          description={`Realizado em ${date} por ${(order.customer_snapshot as any)?.name ?? "Desconhecido"}`}
        />
        <Button variant="outline" onClick={() => window.open(`/admin/pedidos/${order.id}/recibo`, '_blank')}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
        </Button>
      </div>

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
              {order.status === "processing" ? "Em Separação" : order.status}
            </Badge>

            {order.status === "awaiting_payment" && (
              <div className="space-y-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-green-600 hover:bg-green-700" disabled={isConfirming || isRejecting}>
                      {isConfirming ? "Confirmando..." : "Marcar como Pago"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Como o pagamento foi recebido?</DialogTitle>
                      <DialogDescription>
                        Selecione a forma real que o dinheiro entrou. Se foi em dinheiro físico, o valor será somado ao Frente de Caixa atual.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => handleApprove("cash")}>
                        <Banknote className="h-8 w-8 text-green-600" />
                        <span>Dinheiro (Frente de Caixa)</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => handleApprove("bank_transfer")}>
                        <Landmark className="h-8 w-8 text-blue-600" />
                        <span>Pix / Transferência / Cartão</span>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full text-destructive" onClick={handleReject} disabled={isConfirming || isRejecting}>
                  {isRejecting ? "Cancelando..." : "Cancelar Venda"}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Você enviou o link ou chave PIX para o cliente? Assim que ele pagar, clique em Marcar como Pago para liberar a separação.
                </p>
              </div>
            )}

            {order.status === "processing" && (
              <div className="space-y-3 mt-4">
                <Button 
                  className="w-full" 
                  onClick={() => handleStatusChange(order.shipping_method === "pickup" ? "ready_for_pickup" : "shipped")}
                  disabled={isUpdating}
                >
                  {order.shipping_method === "pickup" ? "Pronto para Retirada" : "Despachar Pedido (Enviado)"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Confirme que os itens foram separados e faturados.
                </p>
              </div>
            )}

            {(order.status === "shipped" || order.status === "ready_for_pickup") && (
              <div className="space-y-3 mt-4">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  onClick={() => handleStatusChange("delivered")}
                  disabled={isUpdating}
                >
                  {order.status === "shipped" ? "Confirmar Entrega" : "Entregar ao Cliente"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Printer, Banknote, Landmark, AlertTriangle } from "lucide-react";
import { getOrderById } from "@/services/order.functions";
import { approvePayment, rejectPayment } from "@/services/payment.functions";
import { updateOrderStatus } from "@/services/order.functions";

export const Route = createFileRoute("/admin/pedidos/$id")({
  head: () => ({ meta: [{ title: "Detalhes do Pedido — Hr Shoes" }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    return await getOrderById({ data: { orderId: params.id } });
  },
  component: AdminOrderDetailPage,
});

function getStatusLabel(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "info" | "success" | "warning" }> = {
    draft: { label: "Rascunho", variant: "secondary" },
    awaiting_payment: { label: "Aguardando Pagamento", variant: "warning" },
    payment_processing: { label: "Pagamento em Processamento", variant: "info" },
    paid: { label: "Pago", variant: "success" },
    processing: { label: "Em Separação", variant: "secondary" },
    ready_for_pickup: { label: "Pronto para Retirada", variant: "success" },
    shipped: { label: "Enviado", variant: "info" },
    delivered: { label: "Entregue", variant: "success" },
    completed: { label: "Concluído", variant: "success" },
    cancelled: { label: "Cancelado", variant: "destructive" },
    payment_failed: { label: "Falha no Pagamento", variant: "destructive" },
    return_requested: { label: "Troca Solicitada", variant: "warning" },
    returned: { label: "Devolvido", variant: "secondary" },
    refunded: { label: "Estornado", variant: "secondary" },
  };
  return map[status] ?? { label: status, variant: "outline" };
}

function AdminOrderDetailPage() {
  const order = Route.useLoaderData();
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const date = new Date(order.created_at).toLocaleDateString("pt-BR");

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await updateOrderStatus({
        data: { orderId: order.id, status: newStatus as any },
      });
      if (res.status !== "ok") throw new Error((res as any).message);
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
      if (res.status !== "success") throw new Error((res as any).message);
      toast.success("Pagamento confirmado. O pedido está agora em separação!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao aprovar");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = async () => {
    setShowCancelConfirm(false);
    setIsRejecting(true);
    try {
      const res = await rejectPayment({
        data: { orderId: order.id, reason: "Cancelado manualmente pela vendedora" },
      });
      if (res.status !== "success") throw new Error((res as any).message);
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
        <Button
          variant="outline"
          onClick={() => window.open(`/admin_/pedidos/${order.id}/recibo`, "_blank")}
        >
          <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-border p-6 bg-card text-card-foreground shadow-xs">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Itens do Pedido</h3>
            <div className="space-y-4">
              {(order.order_items ?? []).map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.product_title}</p>
                    <p className="text-sm text-muted-foreground font-mono">SKU: {item.variant_sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatMoney(item.total_cents)}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.qty}x {formatMoney(item.unit_price_cents)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border border-border p-6 bg-card text-card-foreground shadow-xs">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Resumo</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatMoney(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="text-foreground">{formatMoney(order.shipping_cents)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-border pt-3 mt-1 text-foreground">
                <span>Total</span>
                <span>{formatMoney(order.total_cents)}</span>
              </div>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="rounded-xl border border-border p-6 bg-card text-card-foreground shadow-xs">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Status</h3>
            <Badge variant={getStatusLabel(order.status).variant} className="text-[11px] uppercase tracking-wider py-1 mb-4 flex justify-center">
              {getStatusLabel(order.status).label}
            </Badge>

            {order.status === "awaiting_payment" && (
              <div className="space-y-3">
                {/* Approve payment — choose method */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full font-bold"
                      disabled={isConfirming || isRejecting}
                    >
                      {isConfirming ? "Confirmando..." : "Marcar como Pago"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Como o pagamento foi recebido?</DialogTitle>
                      <DialogDescription>
                        Selecione a forma real que o dinheiro entrou. Se foi em dinheiro físico, o
                        valor será somado ao Frente de Caixa atual.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2"
                        onClick={() => handleApprove("cash")}
                      >
                        <Banknote className="h-8 w-8 text-primary" />
                        <span>Dinheiro (Frente de Caixa)</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2"
                        onClick={() => handleApprove("bank_transfer")}
                      >
                        <Landmark className="h-8 w-8 text-primary" />
                        <span>Pix / Transferência / Cartão</span>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Cancel — confirmation dialog (replaces window.confirm) */}
                <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-destructive"
                      disabled={isConfirming || isRejecting}
                    >
                      {isRejecting ? "Cancelando..." : "Cancelar Venda"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Cancelar esta venda?
                      </DialogTitle>
                      <DialogDescription>
                        O pedido será marcado como cancelado. Esta ação não pode ser desfeita.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        Voltar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleReject}
                        disabled={isRejecting}
                      >
                        Confirmar Cancelamento
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <p className="text-xs text-muted-foreground text-center mt-2">
                  Você enviou o link ou chave PIX para o cliente? Assim que ele pagar, clique em
                  Marcar como Pago para liberar a separação.
                </p>
              </div>
            )}

            {order.status === "processing" && (
              <div className="space-y-3 mt-4">
                <Button
                  className="w-full font-bold"
                  onClick={() =>
                    handleStatusChange(
                      order.shipping_method === "pickup" ? "ready_for_pickup" : "shipped",
                    )
                  }
                  disabled={isUpdating}
                >
                  {order.shipping_method === "pickup"
                    ? "Pronto para Retirada"
                    : "Despachar Pedido (Enviado)"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Confirme que os itens foram separados e faturados.
                </p>
              </div>
            )}

            {(order.status === "shipped" || order.status === "ready_for_pickup") && (
              <div className="space-y-3 mt-4">
                <Button
                  className="w-full font-bold"
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

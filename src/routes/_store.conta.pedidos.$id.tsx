import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  Copy,
  Upload,
  Info,
  AlertTriangle,
  QrCode,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/commerce/page-header";
import { ReviewModal } from "@/components/commerce/review-modal";
import { ReturnModal } from "@/components/commerce/return-modal";
import { ErrorState, EmptyState } from "@/components/state/states";
import { formatMoney } from "@/lib/money";
import { getCustomerOrder, getOrderPaymentInstructions } from "@/services/order.functions";
import { uploadPaymentReceipt } from "@/services/payment.functions";

export const Route = createFileRoute("/_store/conta/pedidos/$id")({
  head: () => ({ meta: [{ title: "Detalhes do Pedido — Hr Shoes" }] }),
  loader: async ({ params }) => {
    const [orderRes, instrRes] = await Promise.all([
      getCustomerOrder({ data: { orderId: params.id } }),
      getOrderPaymentInstructions({ data: { orderId: params.id } }).catch(() => ({
        status: "error" as const,
        data: null,
      })),
    ]);

    if (orderRes.status === "error") throw new Error(orderRes.message);

    return {
      order: orderRes.data,
      paymentInstructions:
        instrRes.status === "ok" ? instrRes.data : { pix_key: null, payment_instructions: null },
    };
  },
  component: CustomerOrderDetailPage,
});

function translateStatus(status: string) {
  const map: Record<string, string> = {
    draft: "Rascunho",
    awaiting_payment: "Aguardando Pagamento",
    payment_processing: "Comprovante em Análise",
    paid: "Pago",
    processing: "Em Separação",
    ready_for_pickup: "Pronto para Retirada",
    shipped: "Enviado",
    delivered: "Entregue",
    completed: "Concluído",
    cancelled: "Cancelado",
    payment_failed: "Pagamento Rejeitado",
  };
  return map[status] || status;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (["paid", "completed", "delivered"].includes(status)) return "default";
  if (["awaiting_payment", "payment_processing", "processing", "shipped"].includes(status))
    return "secondary";
  if (["cancelled", "payment_failed"].includes(status)) return "destructive";
  return "outline";
}

function CustomerOrderDetailPage() {
  const { order, paymentInstructions } = Route.useLoaderData() as {
    order: any;
    paymentInstructions: { pix_key: string | null; payment_instructions: string | null };
  };
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  if (!order) {
    return (
      <div className="space-y-6">
        <Link
          to="/conta/pedidos"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar para pedidos
        </Link>
        <EmptyState
          title="Pedido não encontrado"
          description="O pedido solicitado não pôde ser localizado."
        />
      </div>
    );
  }

  const payment = order.payments?.[0];
  // Use canonical field names from order_items: qty and total_cents
  const items = order.order_items || [];
  const address = order.shipping_address || {};

  const handleCopyPix = () => {
    if (!paymentInstructions.pix_key) return;
    navigator.clipboard.writeText(paymentInstructions.pix_key);
    toast.success("Chave PIX copiada com sucesso!");
  };

  const handleUploadReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O comprovante deve ter no máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await uploadPaymentReceipt({
          data: {
            orderId: order.id,
            fileName: file.name,
            fileBase64: base64,
          },
        });
        if (res.status === "error") throw new Error(res.message);
        toast.success("Comprovante enviado! Aguardando confirmação da loja.");
        router.invalidate();
      } catch (err: any) {
        toast.error(err.message || "Erro ao enviar comprovante.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/conta/pedidos"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar para pedidos
        </Link>
        <Badge variant={getStatusVariant(order.status)}>{translateStatus(order.status)}</Badge>
      </div>

      <PageHeader
        title={`Pedido #${order.public_token}`}
        description={`Realizado em ${new Date(order.created_at).toLocaleDateString("pt-BR")}`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: items + shipping */}
        <div className="md:col-span-2 space-y-6">
          {/* Order items */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <Package className="h-5 w-5 text-muted-foreground" />
              Itens do Pedido
            </h3>
            <div className="divide-y">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between py-4 first:pt-0 last:pb-0 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.product_title}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      SKU: {item.variant_sku}
                    </p>
                  </div>
                  <div className="text-right">
                    {/* Canonical DB field: total_cents (not total_price_cents) */}
                    <p className="font-semibold">{formatMoney(item.total_cents)}</p>
                    {/* Canonical DB field: qty (not quantity) */}
                    <p className="text-xs text-muted-foreground">
                      {item.qty}x {formatMoney(item.unit_price_cents)}
                    </p>
                    {order.status === "delivered" && (
                      <ReviewModal productId={item.product_id} productName={item.product_title} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Shipping Address */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              Entrega / Retirada
            </h3>
            {order.shipping_method === "pickup" ? (
              <p className="text-sm text-muted-foreground">
                Modalidade: <strong>Retirada na Loja</strong>
              </p>
            ) : (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Modalidade:</strong> Entrega domiciliar
                </p>
                {address.street && (
                  <p>
                    {address.street}, {address.number}
                    {address.complement && ` — ${address.complement}`}
                  </p>
                )}
                {address.neighborhood && (
                  <p>
                    {address.neighborhood} — {address.city}/{address.state}
                  </p>
                )}
                {address.zipcode && (
                  <p className="font-mono text-xs mt-1">CEP: {address.zipcode}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: totals + payment */}
        <div className="space-y-6">
          {/* Summary totals */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h3 className="font-semibold text-foreground">Resumo de Valores</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>
                  {order.shipping_cents === 0 ? "Grátis" : formatMoney(order.shipping_cents)}
                </span>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>-{formatMoney(order.discount_cents)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground border-t pt-2 mt-2">
                <span>Total</span>
                <span>{formatMoney(order.total_cents)}</span>
              </div>
            </div>
          </div>

          {/* Payment instructions & Upload */}
          {order.status === "awaiting_payment" && (
            <div className="rounded-lg border bg-card p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Como Pagar
              </h3>

              {paymentInstructions.pix_key ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Copie a chave abaixo e cole no app do seu banco:
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded text-[11px] font-mono break-all select-all">
                    {paymentInstructions.pix_key}
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={handleCopyPix}>
                    <Copy className="h-3.5 w-3.5 mr-2" /> Copiar Chave PIX
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Entre em contato com a loja para obter as instruções de pagamento.
                </p>
              )}

              {paymentInstructions.payment_instructions && (
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground border">
                  <p className="font-medium text-foreground mb-1">Instruções adicionais:</p>
                  <p className="whitespace-pre-wrap">{paymentInstructions.payment_instructions}</p>
                </div>
              )}

              {/* Upload section */}
              <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center space-y-2">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Envie o comprovante de pagamento para agilizar a confirmação.
                </p>
                <input
                  type="file"
                  id="receipt-file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleUploadReceipt}
                  disabled={uploading}
                />
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  disabled={uploading}
                >
                  <label htmlFor="receipt-file" className="cursor-pointer">
                    {uploading ? "Enviando..." : "Anexar Comprovante"}
                  </label>
                </Button>
              </div>
            </div>
          )}

          {/* Payment status messages */}
          {order.status === "payment_processing" && (
            <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-200">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-yellow-600" />
              <div>
                <p className="font-semibold">Comprovante em análise</p>
                <p className="mt-0.5 text-yellow-700">
                  A equipe está confirmando seu pagamento. Você será notificado em breve.
                </p>
              </div>
            </div>
          )}

          {payment?.receipt_status === "rejected" && (
            <div className="flex items-start gap-2 bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Comprovante Recusado</p>
                <p className="mt-0.5 text-red-700">
                  O comprovante não pôde ser validado. Por favor, envie novamente ou contate a loja.
                </p>
              </div>
            </div>
          )}

          {["paid", "processing", "completed"].includes(order.status) && (
            <div className="flex items-start gap-2 bg-green-50 text-green-800 text-xs p-3 rounded-lg border border-green-200">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
              <div>
                <p className="font-semibold">Pagamento Confirmado</p>
                <p className="mt-0.5 text-green-700">
                  Seu pagamento foi confirmado! O pedido está sendo preparado.
                </p>
              </div>
            </div>
          )}

          {order.status === "delivered" && (
            <ReturnModal orderId={order.id} />
          )}
        </div>
      </div>
    </div>
  );
}

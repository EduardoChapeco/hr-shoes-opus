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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/commerce/page-header";
import { ErrorState, EmptyState } from "@/components/state/states";
import { formatMoney } from "@/lib/money";
import { getCustomerOrder } from "@/services/order.functions";
import { uploadPaymentReceipt } from "@/services/payment.functions";

export const Route = createFileRoute("/_store/conta/pedidos/$id")({
  head: () => ({ meta: [{ title: "Detalhes do Pedido — Hr Shoes" }] }),
  loader: async ({ params }) => {
    const res = await getCustomerOrder({ data: { orderId: params.id } });
    if (res.status === "error") throw new Error(res.message);
    return res.data;
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
  const order = Route.useLoaderData() as any;
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
  const items = order.order_items || [];
  const address = order.shipping_address || {};

  const pixKey =
    "00020101021226830014br.gov.bcb.pix2561pix.hrshoes.com.br/qr/v2/cobv/7ff34b92-9642-4f33-8a30-fef0d27038cf5204000053039865802BR5908Hr Shoes6009Chapeco62070503***6304D1A2";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    toast.success("Código Pix copiado com sucesso!");
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
        toast.success("Comprovante enviado para análise!");
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
        {/* Left main info */}
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
                    <p className="font-semibold">{formatMoney(item.total_price_cents)}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity}x {formatMoney(item.unit_price_cents)}
                    </p>
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
                Modalidade: <strong>Retirada na Loja</strong> (Avenida Central, 100 — Centro,
                Chapecó)
              </p>
            ) : (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Modalidade:</strong> Entrega domiciliar
                </p>
                <p>
                  {address.street}, {address.number}{" "}
                  {address.complement && `— ${address.complement}`}
                </p>
                <p>
                  {address.neighborhood} — {address.city}/{address.state}
                </p>
                <p className="font-mono text-xs mt-1">CEP: {address.zipcode}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right billing / payment instructions */}
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

          {/* Payment receipt / Upload section */}
          {payment && (
            <div className="rounded-lg border bg-card p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Pagamento ({payment.method === "pix" ? "Pix" : "Depósito Bancário"})
              </h3>

              {order.status === "awaiting_payment" && (
                <div className="space-y-4">
                  {payment.method === "pix" ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Copia e cole a chave abaixo no app do seu banco:
                      </p>
                      <div className="bg-muted p-3 rounded text-[10px] font-mono break-all line-clamp-3 select-all">
                        {pixKey}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={handleCopyPix}
                      >
                        <Copy className="h-3.5 w-3.5 mr-2" /> Copiar Código
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-muted-foreground font-mono bg-muted p-3 rounded">
                      <p>
                        <strong>Banco:</strong> Itaú (341)
                      </p>
                      <p>
                        <strong>Agência:</strong> 0123
                      </p>
                      <p>
                        <strong>Conta:</strong> 45678-9
                      </p>
                      <p>
                        <strong>Favorecido:</strong> HR SHOES LTDA
                      </p>
                      <p>
                        <strong>CNPJ:</strong> 00.000.000/0001-00
                      </p>
                    </div>
                  )}

                  {/* Upload box */}
                  <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center space-y-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Envie o comprovante de pagamento para liberação do pedido.
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

              {order.status === "payment_processing" && (
                <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-200">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-yellow-600" />
                  <div>
                    <p className="font-semibold">Comprovante em análise</p>
                    <p className="mt-0.5 text-yellow-700">
                      A equipe está confirmando seu pagamento. Você receberá uma notificação em
                      breve.
                    </p>
                  </div>
                </div>
              )}

              {payment.receipt_status === "rejected" && (
                <div className="flex items-start gap-2 bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="font-semibold">Comprovante Recusado</p>
                    <p className="mt-0.5 text-red-700">
                      O comprovante enviado não pôde ser validado. Por favor, envie novamente ou
                      contate o suporte.
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

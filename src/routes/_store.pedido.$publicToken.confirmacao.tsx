import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Package, ArrowRight, Copy, Info, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/commerce/page-header";
import { ErrorState } from "@/components/state/states";
import { getOrderByToken } from "@/services/checkout.functions";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/pedido/$publicToken/confirmacao")({
  head: () => ({
    meta: [{ title: "Pedido Confirmado — Hr Shoes" }],
  }),
  loader: ({ params }) => getOrderByToken({ data: { token: params.publicToken } }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const order = Route.useLoaderData() as any;

  if (!order) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-20 md:px-6">
        <ErrorState description="Pedido não encontrado." />
      </div>
    );
  }

  const rawItems = order.items_snapshot || order.order_items || [];
  const items = rawItems.map((item: any) => ({
    productName: item.product_title || item.productName || item.title || "Produto",
    priceCents: item.unit_price_cents || item.price_snapshot_cents || item.priceCents || 0,
    quantity: item.qty || item.quantity || 1,
  }));
  const subtotal =
    order.subtotal_cents ||
    items.reduce((acc: number, item: any) => acc + item.priceCents * item.quantity, 0);
  const shipping = order.shipping_cents || 0;
  const discount = order.discount_cents || 0;
  const total = order.total_cents || Math.max(0, subtotal + shipping - discount);

  const pixKey =
    "00020101021226830014br.gov.bcb.pix2561pix.hrshoes.com.br/qr/v2/cobv/7ff34b92-9642-4f33-8a30-fef0d27038cf5204000053039865802BR5908Hr Shoes6009Chapeco62070503***6304D1A2";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    toast.success("Código Pix copiado!");
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="size-10 text-green-600" aria-hidden />
          </div>
          <PageHeader
            title="Pedido Realizado com Sucesso!"
            description="Seu pedido foi registrado e está aguardando o pagamento para ser enviado."
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Código do pedido:{" "}
            <span className="font-mono font-medium text-foreground">{order.public_token}</span>
          </p>
        </div>

        {/* Payment instructions */}
        {order.status === "awaiting_payment" && (
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Instruções de Pagamento</h3>

            {order.payment_method === "pix" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pague via Pix para aprovação imediata do seu pedido:
                </p>
                <div className="bg-muted p-4 rounded-lg flex items-center justify-between gap-3">
                  <span className="font-mono text-xs break-all line-clamp-2 select-all select-none">
                    {pixKey}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyPix}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4 mr-2" /> Copiar Código
                  </Button>
                </div>
              </div>
            ) : order.payment_method === "manual" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sua reserva foi registrada! Para confirmar seu pedido e combinar o pagamento e entrega, fale com a nossa equipe no WhatsApp:
                </p>
                
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={() => {
                    const phone = "5511999999999"; // TODO: Substituir pelo WhatsApp da loja
                    const message = encodeURIComponent(`Olá! Acabei de realizar o pedido #${order.public_token} no site no valor de ${formatMoney(total)}. Gostaria de combinar o pagamento e a entrega/retirada!`);
                    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                  }}
                >
                  <MessageCircle className="h-5 w-5" /> Falar com Vendedora no WhatsApp
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Faça uma transferência ou depósito para os dados bancários abaixo:
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-1 font-mono text-xs">
                  <p>
                    <strong>Banco:</strong> Itaú (341)
                  </p>
                  <p>
                    <strong>Agência:</strong> 0123
                  </p>
                  <p>
                    <strong>Conta Corrente:</strong> 45678-9
                  </p>
                  <p>
                    <strong>Favorecido:</strong> HR SHOES LTDA
                  </p>
                  <p>
                    <strong>CNPJ:</strong> 00.000.000/0001-00
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>
                Após pagar, você pode acessar os detalhes do pedido em sua conta para anexar e
                enviar o comprovante de pagamento.
              </p>
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <h2 className="flex items-center text-sm font-semibold text-foreground">
              <Package className="mr-2 size-4" /> Resumo da Compra
            </h2>
          </div>
          <div className="px-6 py-4">
            <ul className="divide-y divide-border">
              {items.map((item: any, idx: number) => (
                <li key={idx} className="flex justify-between py-3 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium text-foreground">{item.quantity}x</span>
                    <span className="ml-3 text-muted-foreground">{item.productName}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatMoney(item.priceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-border pt-4 text-sm space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>{shipping === 0 ? "Grátis" : formatMoney(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>-{formatMoney(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-foreground pt-2 border-t">
                <span>Total</span>
                <span className="text-primary font-bold">{formatMoney(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row pt-4">
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

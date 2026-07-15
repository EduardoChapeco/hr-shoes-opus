import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCart } from "@/services/cart.functions";
import { processCheckout } from "@/services/checkout.functions";
import { initiatePayment } from "@/services/payment.functions";
import { CheckCircle2, Ticket, QrCode } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Hr Shoes" }] }),
  loader: async () => {
    const cart = await getCart();
    return (
      cart || {
        id: "",
        items: [],
        totalCents: 0,
        subtotalCents: 0,
        discountCents: 0,
        shippingCents: 0,
        couponCode: null,
        itemCount: 0,
      }
    );
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = Route.useLoaderData();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToken, setSuccessToken] = useState("");
  const [pixData, setPixData] = useState<{ qrCode: string | null }>({ qrCode: null });

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerDocument: "",
    customerPhone: "",
    paymentMethod: "pix" as any,
    shippingMethod: "delivery" as any,
    shippingAddress: {
      zipcode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.shippingMethod === "delivery") {
      const { zipcode, street, number, neighborhood, city, state } = formData.shippingAddress;
      if (!zipcode || !street || !number || !neighborhood || !city || !state) {
        toast.error("Por favor, preencha todos os campos obrigatórios do endereço.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Process Order
      const res = await processCheckout({
        data: { ...formData, cartId: cart.id, paymentMethod: formData.paymentMethod === "manual" ? "pix" : formData.paymentMethod },
      });
      
      if (res.status === "success") {
        // 2. Initiate Payment (Gateway Transact)
        try {
          const payRes = await initiatePayment({
            data: {
              orderId: res.orderToken,
              method: formData.paymentMethod === "credit_card" ? "credit_card" : "pix",
              amountCents: cart.totalCents
            }
          });
          
          if (payRes.status === "success") {
            setPixData({ qrCode: payRes.pix_qr_code });
          }
        } catch(payErr: any) {
           toast.error("Pedido criado, mas falha ao comunicar com Gateway de Pagamento.");
        }
        
        setSuccessToken(res.orderToken);
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      toast.error("Erro ao finalizar compra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successToken) {
    return (
      <div className="container max-w-2xl py-24 mx-auto px-4 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
        <h1 className="text-3xl font-serif font-bold mb-4">Pedido Realizado!</h1>
        <p className="text-muted-foreground mb-8">
          Seu pedido <strong>#{successToken.split("-")[0]}</strong> foi criado com sucesso e está aguardando
          pagamento.
        </p>

        {pixData.qrCode && (
          <div className="bg-muted/30 p-6 rounded-xl border border-border inline-block mb-8">
            <QrCode className="w-8 h-8 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Pague via PIX Copia e Cola</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Copie o código abaixo e cole no aplicativo do seu banco para finalizar a compra.
            </p>
            <div className="flex gap-2">
              <Input readOnly value={pixData.qrCode} className="font-mono text-xs text-center" />
              <Button onClick={() => {
                navigator.clipboard.writeText(pixData.qrCode!);
                toast.success("Código copiado!");
              }}>Copiar</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              O status do pedido será atualizado automaticamente assim que o pagamento for reconhecido pelo banco.
            </p>
          </div>
        )}

        <div>
          <Button onClick={() => navigate({ to: "/conta" })}>Acompanhar Pedido</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-12 mx-auto px-4">
      <h1 className="text-3xl font-serif font-bold tracking-tight mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Seus Dados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Nome Completo *</label>
                  <Input
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail *</label>
                  <Input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone / WhatsApp</label>
                  <Input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">CPF / CNPJ</label>
                  <Input
                    value={formData.customerDocument}
                    onChange={(e) => setFormData({ ...formData, customerDocument: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Entrega</h2>

              <div className="flex gap-4 mb-4">
                <Button
                  type="button"
                  variant={formData.shippingMethod === "delivery" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, shippingMethod: "delivery" })}
                >
                  Entregar no meu endereço
                </Button>
                <Button
                  type="button"
                  variant={formData.shippingMethod === "pickup" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, shippingMethod: "pickup" })}
                >
                  Retirar na Loja
                </Button>
              </div>

              {formData.shippingMethod === "delivery" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg border">
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-medium">CEP *</label>
                    <Input
                      required
                      value={formData.shippingAddress.zipcode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, zipcode: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Rua / Avenida *</label>
                    <Input
                      required
                      value={formData.shippingAddress.street}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, street: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-medium">Número *</label>
                    <Input
                      required
                      value={formData.shippingAddress.number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, number: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Complemento</label>
                    <Input
                      value={formData.shippingAddress.complement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: {
                            ...formData.shippingAddress,
                            complement: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-medium">Bairro *</label>
                    <Input
                      required
                      value={formData.shippingAddress.neighborhood}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: {
                            ...formData.shippingAddress,
                            neighborhood: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-medium">Cidade *</label>
                    <Input
                      required
                      value={formData.shippingAddress.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, city: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-medium">Estado (UF) *</label>
                    <Select
                      value={formData.shippingAddress.state}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, state: v },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="RJ">RJ</SelectItem>
                        <SelectItem value="MG">MG</SelectItem>
                        <SelectItem value="RS">RS</SelectItem>
                        <SelectItem value="PR">PR</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="BA">BA</SelectItem>
                        <SelectItem value="DF">DF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Pagamento</h2>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.paymentMethod === "pix" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, paymentMethod: "pix" })}
                >
                  PIX
                </Button>
                <Button
                  type="button"
                  variant={formData.paymentMethod === "credit_card" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, paymentMethod: "credit_card" })}
                >
                  Cartão de Crédito
                </Button>
              </div>
            </div>

            <div className="hidden lg:block">
              <Button
                type="submit"
                size="lg"
                className="w-full text-lg h-14 rounded-full"
                disabled={isSubmitting || cart.items.length === 0}
              >
                {isSubmitting ? "Processando..." : "Confirmar e Pagar"}
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-muted/50 rounded-xl p-6 h-fit sticky top-24">
          <h2 className="text-xl font-semibold mb-6">Resumo do Pedido</h2>
          <div className="space-y-4 mb-6">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.qty}x {item.productTitle}
                </span>
                <span className="font-medium">{formatMoney(item.lineTotalCents)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2 mb-6 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(cart.subtotalCents)}</span>
            </div>
            {cart.couponCode && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-1">
                  <Ticket className="h-4 w-4" /> Cupom ({cart.couponCode})
                </span>
                <span>-{formatMoney(cart.discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Frete {formData.shippingMethod === "pickup" ? "(Retirada)" : ""}</span>
              <span>{formData.shippingMethod === "pickup" ? "Grátis" : "A combinar"}</span>
            </div>
          </div>
          <div className="flex justify-between items-end border-t pt-4 mb-8">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-2xl">{formatMoney(cart.totalCents)}</span>
          </div>

          <div className="lg:hidden">
            <Button
              form="checkout-form"
              type="submit"
              size="lg"
              className="w-full text-lg h-14 rounded-full"
              disabled={isSubmitting || cart.items.length === 0}
            >
              {isSubmitting ? "Processando..." : "Confirmar e Pagar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

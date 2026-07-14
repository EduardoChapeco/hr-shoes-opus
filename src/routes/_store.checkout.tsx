import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCart } from "@/services/cart.functions";
import { processCheckout } from "@/services/checkout.functions";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_store/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Hr Shoes" }] }),
  loader: async () => {
    const cart = await getCart();
    return cart || { items: [], totalCents: 0, subtotalCents: 0, itemCount: 0 };
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = Route.useLoaderData();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToken, setSuccessToken] = useState("");

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerDocument: "",
    paymentMethod: "pix" as any,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await processCheckout({
        data: {
          ...formData,
          shippingMethod: "delivery", // mock simple defaults for Phase 2
          shippingAddress: { street: "Rua Exemplo" },
        }
      });
      if (res.status === "success") {
        setSuccessToken(res.orderToken);
      } else {
        alert(res.message);
      }
    } catch (e) {
      alert("Erro ao finalizar compra.");
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
          Seu pedido <strong>#{successToken}</strong> foi criado com sucesso e está aguardando pagamento.
        </p>
        <Button onClick={() => navigate({ to: "/" })}>Voltar para a Loja</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-12 mx-auto px-4">
      <h1 className="text-3xl font-serif font-bold tracking-tight mb-8">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Seus Dados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <Input 
                    required 
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input 
                    type="email" 
                    required 
                    value={formData.customerEmail}
                    onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">CPF (Opcional)</label>
                  <Input 
                    value={formData.customerDocument}
                    onChange={e => setFormData({ ...formData, customerDocument: e.target.value })}
                  />
                </div>
              </div>
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
                  variant={formData.paymentMethod === "manual" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, paymentMethod: "manual" })}
                >
                  Transferência Manual
                </Button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full text-lg h-14 rounded-full" disabled={isSubmitting || cart.items.length === 0}>
              {isSubmitting ? "Processando..." : "Confirmar e Pagar"}
            </Button>
          </form>
        </div>

        <div className="bg-muted/50 rounded-xl p-6 h-fit sticky top-24">
          <h2 className="text-xl font-semibold mb-6">Resumo do Pedido</h2>
          <div className="space-y-4 mb-6">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.qty}x {item.productTitle}</span>
                <span className="font-medium">{formatMoney(item.lineTotalCents)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2 mb-6">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(cart.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Frete</span>
              <span className="text-green-600">Grátis</span>
            </div>
          </div>
          <div className="flex justify-between items-end border-t pt-4">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-2xl">{formatMoney(cart.totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

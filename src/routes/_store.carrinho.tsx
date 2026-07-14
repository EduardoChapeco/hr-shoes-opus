import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getCart,
  removeFromCart,
  updateCartItemQty,
  applyCouponToCart,
} from "@/services/cart.functions";
import { Trash2, Plus, Minus, ArrowRight, Ticket } from "lucide-react";
import { EmptyState } from "@/components/state/states";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/carrinho")({
  head: () => ({ meta: [{ title: "Meu Carrinho — Hr Shoes" }] }),
  loader: async () => {
    const cart = await getCart();
    return (
      cart || {
        items: [],
        totalCents: 0,
        subtotalCents: 0,
        discountCents: 0,
        itemCount: 0,
        couponCode: null,
      }
    );
  },
  component: StoreCartPage,
});

function StoreCartPage() {
  const cart = Route.useLoaderData();
  const router = useRouter();

  const [coupon, setCoupon] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const handleRemove = async (itemId: string) => {
    await removeFromCart({ data: { itemId } });
    router.invalidate();
  };

  const handleUpdateQty = async (variantId: string, delta: number) => {
    try {
      await updateCartItemQty({ data: { variantId, delta } });
      router.invalidate();
    } catch (e: any) {
      toast.error("Erro ao atualizar carrinho.");
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupon) return;
    setIsApplying(true);
    try {
      const res = await applyCouponToCart({ data: { code: coupon } });
      if (res.status === "success") {
        toast.success(res.message);
        setCoupon("");
        router.invalidate();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Erro ao aplicar cupom.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="container max-w-4xl py-12 mx-auto px-4">
      <h1 className="text-3xl font-serif font-bold tracking-tight mb-8">Meu Carrinho</h1>

      {!cart || cart.items.length === 0 ? (
        <EmptyState
          title="Seu carrinho está vazio"
          description="Explore nossa coleção e encontre o seu próximo par de calçados favorito."
          action={
            <Button onClick={() => router.navigate({ to: "/catalogo" })}>
              Continuar Comprando
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex gap-6 py-6 border-b">
                <div className="h-32 w-24 flex-shrink-0 overflow-hidden rounded-md border border-muted bg-muted">
                  {item.coverUrl ? (
                    <img
                      src={item.coverUrl}
                      alt={item.productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-secondary" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{item.productTitle}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cor: {item.variantAttributes?.color || "Padrão"} | Tam:{" "}
                        {item.variantAttributes?.size || "Único"}
                      </p>
                    </div>
                    <p className="font-medium text-base">{formatMoney(item.priceCents)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        onClick={() => handleUpdateQty(item.variantId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.qty}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        onClick={() => handleUpdateQty(item.variantId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-xl p-6 h-fit sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>

            <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-6">
              <Input
                placeholder="Cupom de desconto"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <Button type="submit" variant="secondary" disabled={isApplying || !coupon}>
                Aplicar
              </Button>
            </form>

            <div className="space-y-4 text-sm mb-6 border-b pb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({cart.itemCount} itens)</span>
                <span className="font-medium">{formatMoney(cart.subtotalCents)}</span>
              </div>

              {cart.couponCode && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Ticket className="h-4 w-4" /> Cupom ({cart.couponCode})
                  </span>
                  <span className="font-medium">-{formatMoney(cart.discountCents)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="text-muted-foreground text-xs">Calculado no próximo passo</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="font-semibold text-lg">Total estimado</span>
              <span className="font-bold text-2xl tracking-tight">
                {formatMoney(cart.totalCents)}
              </span>
            </div>

            <Link to="/checkout" className="w-full">
              <Button size="lg" className="w-full font-semibold rounded-full shadow-md">
                Finalizar Compra
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <div className="mt-4 text-center">
              <Link
                to="/catalogo"
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

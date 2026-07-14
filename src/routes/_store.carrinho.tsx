import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ShoppingBag, ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState, ErrorState } from "@/components/state/states";
import { getCart, removeFromCart, updateCartItemQty } from "@/services/cart.functions";
import type { CartDTO } from "@/types/orders";

export const Route = createFileRoute("/_store/carrinho")({
  head: () => ({
    meta: [{ title: "Meu Carrinho — Hr Shoes" }],
  }),
  loader: () => getCart(),
  component: CartPage,
});

function CartPage() {
  const cart: CartDTO | null = Route.useLoaderData();
  const router = useRouter();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 md:py-20">
        <EmptyState
          title="Seu carrinho está vazio"
          description="Navegue pelo nosso catálogo e descubra produtos incríveis."
          action={
            <Button asChild size="lg">
              <Link to="/catalogo">Ir para o catálogo</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const handleRemove = async (itemId: string) => {
    setLoadingItemId(itemId);
    try {
      await removeFromCart({ data: { itemId } });
      toast.success("Item removido");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover item");
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleUpdateQuantity = async (variantId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    setLoadingItemId(variantId);
    try {
      await updateCartItemQty({ data: { variantId, delta } });
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar quantidade");
    } finally {
      setLoadingItemId(null);
    }
  };

  const formatMoney = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      {/* Breadcrumb */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link to="/" className="hover:text-foreground">
          Início
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground">Carrinho</span>
      </nav>

      <PageHeader
        title="Meu Carrinho"
        description="Revise seus itens antes de finalizar a compra."
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8">
          <ul className="divide-y divide-border border-b border-border">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-6 sm:gap-6">
                <Link to="/produto/$slug" params={{ slug: item.productTitle }} className="shrink-0">
                  <div className="aspect-square w-24 overflow-hidden rounded-lg border border-border bg-secondary sm:w-32">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.productTitle}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-muted-foreground">
                        <ShoppingBag className="size-8" aria-hidden />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-foreground">
                        <Link to="/produto/$slug" params={{ slug: item.productTitle }}>
                          {item.productTitle}
                        </Link>
                      </h3>
                      {Object.entries(item.variantAttributes).map(([k, v]) => (
                        <p key={k} className="mt-1 text-sm text-muted-foreground capitalize">
                          {k}: {v as string}
                        </p>
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatMoney(item.priceCents)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center rounded-md border border-border">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.variantId, item.qty, -1)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="flex w-8 items-center justify-center text-sm font-medium">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.variantId, item.qty, 1)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleRemove(item.id)}
                      disabled={loadingItemId === item.id}
                    >
                      <Trash2 className="mr-2 size-4" aria-hidden />
                      {loadingItemId === item.id ? "Removendo..." : "Remover"}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Resumo do pedido</h2>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium text-foreground">{formatMoney(cart.subtotalCents)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Frete</dt>
                <dd className="text-muted-foreground">Calculado no checkout</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4 text-base">
                <dt className="font-semibold text-foreground">Total Estimado</dt>
                <dd className="font-bold text-foreground">{formatMoney(cart.totalCents)}</dd>
              </div>
            </dl>

            <div className="mt-8">
              <Button asChild size="lg" className="w-full">
                <Link to="/checkout/identificacao">Continuar para o checkout</Link>
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Os preços e o frete não são definitivos até a finalização do pedido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

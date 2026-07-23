import { Link, useRouter } from "@tanstack/react-router";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartContext } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "./price-display";

export function SlideOutCart() {
  const { cart, isCartOpen, setIsCartOpen, updateQty, removeItem, isCartUpdating } = useCartContext();
  const router = useRouter();

  const handleNavigateToCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCartOpen(false);
    router.navigate({ to: "/checkout" });
  };

  const handleNavigateToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCartOpen(false);
    router.navigate({ to: "/catalogo" });
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Meu Carrinho
            {cart && cart.itemCount > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                {cart.itemCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <ShoppingBag className="size-8" />
              </div>
              <h3 className="text-lg font-medium">Seu carrinho está vazio</h3>
              <p className="text-sm text-muted-foreground">
                Que tal adicionar alguns produtos incríveis?
              </p>
              <Button onClick={handleNavigateToCatalog} className="mt-4">
                Continuar Comprando
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {cart.items.map((item: any) => (
                <div key={item.id} className={cn("flex gap-4", isCartUpdating && "opacity-60 pointer-events-none")}>
                  <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-secondary border">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.productTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between items-start">
                      <div className="pr-2">
                        <h4 className="text-sm font-medium line-clamp-2">
                          {item.productTitle}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Object.entries(item.variantAttributes || {}).length > 0
                            ? Object.entries(item.variantAttributes || {})
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" | ")
                            : "Padrão"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remover item"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-end justify-between">
                      <div className="flex items-center rounded-md border shadow-sm">
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted"
                          onClick={() => updateQty(item.variantId, -1)}
                          disabled={item.qty <= 1}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-medium">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted"
                          onClick={() => updateQty(item.variantId, 1)}
                          disabled={item.isOutOfStock}
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <PriceDisplay amountCents={item.priceCents} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="border-t bg-muted/50 p-6 space-y-4">
            <div className="flex items-center justify-between font-medium">
              <span>Subtotal</span>
              <span>{formatMoney(cart.subtotalCents)}</span>
            </div>
            {cart.discountCents > 0 && (
              <div className="flex items-center justify-between text-sm text-destructive font-medium">
                <span>Descontos</span>
                <span>-{formatMoney(cart.discountCents)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatMoney(cart.totalCents - cart.shippingCents)}</span>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Frete calculado no próximo passo.
            </p>

            <Button
              className="w-full text-base font-semibold py-6 h-auto"
              onClick={handleNavigateToCheckout}
              disabled={isCartUpdating}
            >
              Finalizar Compra
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCart, updateCartItemQty, removeFromCart } from "@/services/cart.functions";
import type { CartDTO } from "@/types/orders";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

interface CartContextType {
  cart: CartDTO | null;
  isCartOpen: boolean;
  isCartUpdating: boolean;
  setIsCartOpen: (open: boolean) => void;
  refreshCart: () => Promise<void>;
  updateQty: (variantId: string, delta: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  initCart: (initialCart: CartDTO | null) => void;
  setCartData: (cart: CartDTO | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartUpdating, setIsCartUpdating] = useState(false);
  const router = useRouter();

  // Used by the root layout to seed the initial cart state
  const initCart = (initialCart: CartDTO | null) => {
    // Apenas sobrecreve se for o carregamento inicial (cart null) 
    // ou se o carrinho do layout possuir atualizações mais recentes de SSR
    if (!cart || (initialCart && initialCart.id === cart.id)) {
      setCart(initialCart);
    }
  };

  const refreshCart = async () => {
    // Previne concorrência visual mas permite refresh contínuo em background
    if (isCartUpdating) return;
    
    setIsCartUpdating(true);
    try {
      const updatedCart = await getCart();
      setCart(updatedCart);
      router.invalidate(); // also invalidate to sync TanStack Router loaders
    } catch (e) {
      console.error("Failed to refresh cart", e);
      // Não exibe erro na UI pois pode ser apenas um sync falho em background
    } finally {
      setIsCartUpdating(false);
    }
  };

  // Cross-tab synchronization
  useEffect(() => {
    const handleFocus = () => {
      // Revalida automaticamente o carrinho quando a aba ganha foco, caso haja alterações em outra aba
      if (!isCartUpdating) {
        refreshCart();
      }
    };
    
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isCartUpdating]);

  const updateQty = async (variantId: string, delta: number) => {
    setIsCartUpdating(true);
    try {
      await updateCartItemQty({ data: { variantId, delta } });
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado ao atualizar carrinho");
    } finally {
      await refreshCart();
    }
  };

  const removeItem = async (itemId: string) => {
    setIsCartUpdating(true);
    try {
      await removeFromCart({ data: { itemId } });
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado ao remover item");
    } finally {
      await refreshCart();
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        isCartUpdating,
        setIsCartOpen,
        refreshCart,
        updateQty,
        removeItem,
        initCart,
        setCartData: setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type Antique from "@/models/antiques/Antique";

type CartItem = { antique: Antique; quantity: number };

type ShoppingContextValue = {
  wishlist: Antique[];
  cart: CartItem[];
  toggleWishlist: (antique: Antique) => void;
  isWishlisted: (id: string) => boolean;
  addToCart: (antique: Antique) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
};

const ShoppingContext = createContext<ShoppingContextValue | undefined>(undefined);

export function ShoppingProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [wishlist, setWishlist] = useState<Antique[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const toggleWishlist = (antique: Antique) => {
    setWishlist((current) => {
      const next = current.some((item) => item.id === antique.id)
        ? current.filter((item) => item.id !== antique.id)
        : [...current, antique];
      return next;
    });
  };

  const addToCart = (antique: Antique) => {
    setCart((current) => {
      const existing = current.some((item) => item.antique.id === antique.id);
      const next = existing
        ? current.map((item) => item.antique.id === antique.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { antique, quantity: 1 }];
      return next;
    });
  };

  const removeFromCart = (id: string) => {
    setCart((current) => {
      const next = current.filter((item) => item.antique.id !== id);
      return next;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(id);
    setCart((current) => {
      const next = current.map((item) => item.antique.id === id ? { ...item, quantity } : item);
      return next;
    });
  };

  const value = useMemo(() => ({
    wishlist,
    cart,
    toggleWishlist,
    isWishlisted: (id: string) => wishlist.some((item) => item.id === id),
    addToCart,
    removeFromCart,
    updateQuantity,
  }), [wishlist, cart]);

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShopping() {
  const context = useContext(ShoppingContext);
  if (!context) throw new Error("useShopping must be used inside ShoppingProvider");
  return context;
}
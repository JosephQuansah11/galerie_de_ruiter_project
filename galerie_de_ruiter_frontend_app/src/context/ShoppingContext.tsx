import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type Antique from "@/models/antiques/Antique";
import { useAuth } from "@/context/AuthContext";

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

function readStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
}

export function ShoppingProvider({ children }: Readonly<{ children: ReactNode }>) {
  const auth = useAuth();
  const storageKey = auth.profile?.id?.toString() ?? auth.profile?.username ?? "anonymous";
  const wishlistKey = `galerie-wishlist:${storageKey}`;
  const cartKey = `galerie-cart:${storageKey}`;
  const [wishlist, setWishlist] = useState<Antique[]>(() => readStorage(`galerie-wishlist:${storageKey}`, []));
  const [cart, setCart] = useState<CartItem[]>(() => readStorage(`galerie-cart:${storageKey}`, []));

  useEffect(() => {
    setWishlist(readStorage(wishlistKey, []));
    setCart(readStorage(cartKey, []));
  }, [wishlistKey, cartKey]);

  const toggleWishlist = (antique: Antique) => {
    setWishlist((current) => {
      const next = current.some((item) => item.id === antique.id)
        ? current.filter((item) => item.id !== antique.id)
        : [...current, antique];
      localStorage.setItem(wishlistKey, JSON.stringify(next));
      return next;
    });
  };

  const addToCart = (antique: Antique) => {
    setCart((current) => {
      const existing = current.some((item) => item.antique.id === antique.id);
      const next = existing
        ? current.map((item) => item.antique.id === antique.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { antique, quantity: 1 }];
      localStorage.setItem(cartKey, JSON.stringify(next));
      return next;
    });
  };

  const removeFromCart = (id: string) => {
    setCart((current) => {
      const next = current.filter((item) => item.antique.id !== id);
      localStorage.setItem(cartKey, JSON.stringify(next));
      return next;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(id);
    setCart((current) => {
      const next = current.map((item) => item.antique.id === id ? { ...item, quantity } : item);
      localStorage.setItem(cartKey, JSON.stringify(next));
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
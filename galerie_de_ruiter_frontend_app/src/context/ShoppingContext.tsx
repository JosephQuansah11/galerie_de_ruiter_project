import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type Antique from "@/models/antiques/Antique";
import { shoppingReducer, initialShoppingState } from "./shoppingReducer";
import type { ShoppingContextValue } from "./shoppingTypes";

const ShoppingContext = createContext<ShoppingContextValue | undefined>(undefined);

export function ShoppingProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(shoppingReducer, initialShoppingState);
  const value = useMemo(() => ({
    ...state,
    toggleWishlist: (antique: Antique) => dispatch({ type: "toggle-wishlist", antique }),
    isWishlisted: (id: string) => state.wishlist.some((item) => item.id === id),
    addToCart: (antique: Antique) => dispatch({ type: "add-cart", antique }),
    removeFromCart: (id: string) => dispatch({ type: "remove-cart", id }),
    updateQuantity: (id: string, quantity: number) => dispatch({ type: "update-quantity", id, quantity }),
  }), [state]);
  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShopping() {
  const context = useContext(ShoppingContext);
  if (!context) throw new Error("useShopping must be used inside ShoppingProvider");
  return context;
}

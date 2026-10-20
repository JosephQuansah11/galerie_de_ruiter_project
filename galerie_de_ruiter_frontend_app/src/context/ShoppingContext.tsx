import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type Antique from "@/models/antiques/Antique";
import { addWishlistItem, getWishlist, removeWishlistItem } from "@/apis/wishlist_api";
import { shoppingReducer, initialShoppingState } from "./shoppingReducer";
import type { ShoppingContextValue } from "./shoppingTypes";

const ShoppingContext = createContext<ShoppingContextValue | undefined>(undefined);

export function ShoppingProvider({ children, authenticated = false, loadWishlist = false }: Readonly<{
  children: ReactNode;
  authenticated?: boolean;
  /** Only the catalogue, a piece and the wishlist need the list; admin pages do not. */
  loadWishlist?: boolean;
}>) {
  const [state, dispatch] = useReducer(shoppingReducer, initialShoppingState);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState<string>();
  /** A provider created without an authenticated visitor is also how tests seed the local list. */
  const wasAuthenticated = useRef(authenticated);
  /** Ignores a list request that a sign-out (or a retry) has made stale. */
  const wishlistRequest = useRef(0);

  const refreshWishlist = useCallback(async () => {
    const request = ++wishlistRequest.current;
    if (!authenticated) {
      dispatch({ type: "set-wishlist", wishlist: [] });
      setWishlistLoading(false);
      setWishlistError(undefined);
      return;
    }
    setWishlistLoading(true);
    setWishlistError(undefined);
    try {
      const wishlist = await getWishlist();
      if (request === wishlistRequest.current) dispatch({ type: "set-wishlist", wishlist });
    } catch {
      if (request === wishlistRequest.current) setWishlistError("wishlistLoadFailed");
    } finally {
      if (request === wishlistRequest.current) setWishlistLoading(false);
    }
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) {
      // Only a real sign-out clears the list; a provider that starts without a visitor keeps the
      // local selection (the tests seed it that way, and the heart already asked for an account).
      wishlistRequest.current += 1;
      if (wasAuthenticated.current) {
        dispatch({ type: "set-wishlist", wishlist: [] });
        setWishlistLoading(false);
        setWishlistError(undefined);
      }
      wasAuthenticated.current = false;
      return;
    }
    wasAuthenticated.current = true;
    if (loadWishlist) void refreshWishlist();
  }, [authenticated, loadWishlist, refreshWishlist]);

  const toggleWishlist = async (antique: Antique) => {
    const exists = state.wishlist.some((item) => item.id === antique.id);
    // The heart responds at once; the server call only confirms it (or puts it back).
    dispatch({ type: "toggle-wishlist", antique });
    if (!authenticated) return;
    try {
      await (exists ? removeWishlistItem : addWishlistItem)(antique.id);
      setWishlistError(undefined);
    } catch {
      dispatch({ type: "toggle-wishlist", antique });
      setWishlistError("wishlistSaveFailed");
    }
  };

  const value = useMemo(() => ({
    ...state,
    wishlistLoading,
    wishlistError,
    refreshWishlist,
    toggleWishlist,
    isWishlisted: (id: string) => state.wishlist.some((item) => item.id === id),
    addToCart: (antique: Antique) => dispatch({ type: "add-cart", antique }),
    removeFromCart: (id: string) => dispatch({ type: "remove-cart", id }),
    updateQuantity: (id: string, quantity: number) => dispatch({ type: "update-quantity", id, quantity }),
  }), [state, wishlistLoading, wishlistError, refreshWishlist]);
  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShopping() {
  const context = useContext(ShoppingContext);
  if (!context) throw new Error("useShopping must be used inside ShoppingProvider");
  return context;
}

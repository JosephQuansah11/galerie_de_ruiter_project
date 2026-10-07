import type Antique from "@/models/antiques/Antique";

export type CartItem = { antique: Antique; quantity: number };
export type ShoppingState = { wishlist: Antique[]; cart: CartItem[] };
export type ShoppingAction =
  | { type: "toggle-wishlist"; antique: Antique }
  | { type: "add-cart"; antique: Antique }
  | { type: "remove-cart"; id: string }
  | { type: "update-quantity"; id: string; quantity: number };
export type ShoppingContextValue = ShoppingState & {
  toggleWishlist: (antique: Antique) => void;
  isWishlisted: (id: string) => boolean;
  addToCart: (antique: Antique) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
};

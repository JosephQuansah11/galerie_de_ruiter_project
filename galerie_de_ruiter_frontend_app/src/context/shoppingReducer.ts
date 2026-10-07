import type { ShoppingAction, ShoppingState } from "./shoppingTypes";

export const initialShoppingState: ShoppingState = { wishlist: [], cart: [] };

export function shoppingReducer(state: ShoppingState, action: ShoppingAction): ShoppingState {
  if (action.type === "toggle-wishlist") {
    const exists = state.wishlist.some((item) => item.id === action.antique.id);
    const wishlist = exists ? state.wishlist.filter((item) => item.id !== action.antique.id) : [...state.wishlist, action.antique];
    return { ...state, wishlist };
  }
  if (action.type === "add-cart") {
    const exists = state.cart.some((item) => item.antique.id === action.antique.id);
    const cart = exists ? state.cart.map((item) => item.antique.id === action.antique.id ? { ...item, quantity: item.quantity + 1 } : item) : [...state.cart, { antique: action.antique, quantity: 1 }];
    return { ...state, cart };
  }
  const cart = action.type === "remove-cart" || action.quantity < 1
    ? state.cart.filter((item) => item.antique.id !== action.id)
    : state.cart.map((item) => item.antique.id === action.id ? { ...item, quantity: action.quantity } : item);
  return { ...state, cart };
}

import type { RefObject } from "react";
import type { CartItem } from "@/context/shoppingTypes";
import { CartRow } from "./CartRow";

type Props = {
  items: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  /** The list itself, so a shortcut can bring its last row into view. */
  listRef?: RefObject<HTMLDivElement | null>;
};
export function CartItems({ items, updateQuantity, removeFromCart, listRef }: Props) {
  return <div className="shopping-list" ref={listRef}>
    {items.map(({ antique, quantity }) => <CartRow key={antique.id} antique={antique}
      quantity={quantity} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />)}
  </div>;
}

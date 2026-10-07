import type { CartItem } from "@/context/shoppingTypes";
import { CartRow } from "./CartRow";

type Props = { items: CartItem[]; updateQuantity: (id: string, quantity: number) => void; removeFromCart: (id: string) => void };
export function CartItems({ items, updateQuantity, removeFromCart }: Props) {
  return <div className="shopping-list">
    {items.map(({ antique, quantity }) => <CartRow key={antique.id} antique={antique}
      quantity={quantity} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />)}
  </div>;
}

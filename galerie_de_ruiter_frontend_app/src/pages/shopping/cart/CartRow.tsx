import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Trash2 } from "lucide-react";
import type Antique from "@/models/antiques/Antique";
import { useLanguage } from "@/context/LanguageContext";
import { formatEuroAmount } from "@/i18n";

type Props = { antique: Antique; quantity: number; updateQuantity: (id: string, quantity: number) => void; removeFromCart: (id: string) => void };
export function CartRow({ antique, quantity, updateQuantity, removeFromCart }: Props) {
  const { t, locale } = useLanguage();
  return <article className="shopping-row">
    <div className="shopping-thumb">{antique.title.slice(0, 1)}</div>
    <div className="shopping-row-copy"><h2>{antique.title}</h2><strong>
      {antique.price == null ? t("priceOnRequest") : formatEuroAmount(antique.price, locale)}
    </strong></div>
    <Form.Control className="quantity-input" type="number" min={1} value={quantity}
      aria-label={t("quantityFor", { title: antique.title })}
      onChange={(event) => updateQuantity(antique.id, Number(event.target.value))} />
    <Button className="btn btn-link" type="button"
      aria-label={t("removeFromCart", { title: antique.title })}
      onClick={() => removeFromCart(antique.id)}><Trash2 size={17} /></Button>
  </article>;
}

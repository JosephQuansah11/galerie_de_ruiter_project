import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShopping } from "@/context/ShoppingContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatEuroAmount } from "@/i18n";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart } = useShopping();
  const { t, locale } = useLanguage();
  const total = cart.reduce(
    (sum, item) => sum + (item.antique.price ?? 0) * item.quantity,
    0,
  );

  return (
    <section className="shopping-page">
      <div className="shopping-heading">
        <div>
          <span className="catalogue-artist">{t("cart")}</span>
          <h1>{t("cart")}</h1>
        </div>
        <ShoppingBag size={32} />
      </div>

      {cart.length === 0 ? (
        <div className="catalogue-state">
          <ShoppingBag size={28} />
          <span>{t("emptyCart")}</span>
          <Button as="button"
            className="btn btn-outline-dark"
            type="button"
            onClick={() => navigate("/antiques")}
          >
            {t("browseAntiques")} <ArrowRight size={16} />
          </Button>
        </div>
      ) : (
        <>
          <div className="shopping-list">
            {cart.map(({ antique, quantity }) => (
              <article className="shopping-row" key={antique.id}>
                <div className="shopping-thumb">
                  {antique.title.slice(0, 1)}
                </div>
                <div className="shopping-row-copy">
                  <h2>{antique.title}</h2>
                  <strong>
                    {antique.price == null
                      ? t("priceOnRequest")
                      : formatEuroAmount(antique.price, locale)}
                  </strong>
                </div>
                <Form.Control
                  className="quantity-input"
                  type="number"
                  min={1}
                  value={quantity}
                  aria-label={t("quantityFor", { title: antique.title })}
                  onChange={(event) =>
                    updateQuantity(antique.id, Number(event.target.value))
                  }
                />
                <Button as="button"
                  className="btn btn-link"
                  type="button"
                  aria-label={t("removeFromCart", { title: antique.title })}
                  onClick={() => removeFromCart(antique.id)}
                >
                  <Trash2 size={17} />
                </Button>
              </article>
            ))}
          </div>
          <div className="cart-total">
            <span>{t("estimatedTotal")}</span>
            <strong>{formatEuroAmount(total, locale)}</strong>
          </div>
        </>
      )}
    </section>
  );
}

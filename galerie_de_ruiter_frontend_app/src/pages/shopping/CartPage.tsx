import { Form } from "react-bootstrap";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useShopping } from "@/context/ShoppingContext";
import { useLanguage } from "@/context/LanguageContext";
import { createCheckoutSession } from "@/apis/backend_api";
import { useState } from "react";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart } = useShopping();
  const { t } = useLanguage();
  const [checkoutError, setCheckoutError] = useState<string>();
  const total = cart.reduce(
    (sum, item) => sum + (item.antique.price ?? 0) * item.quantity,
    0,
  );

  const startCheckout = async () => {
    setCheckoutError(undefined);
    try {
      const url = await createCheckoutSession(
        cart.map(({ antique, quantity }) => ({
          antiqueId: antique.id,
          quantity,
        })),
      );
      window.location.assign(url);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setCheckoutError(
        message ?? "Checkout could not be started. Please try again.",
      );
    }
  };

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
          <button
            className="btn btn-outline-dark"
            type="button"
            onClick={() => navigate("/antiques")}
          >
            {t("browseAntiques")} <ArrowRight size={16} />
          </button>
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
                      : `EUR ${antique.price.toFixed(2)}`}
                  </strong>
                </div>
                <Form.Control
                  className="quantity-input"
                  type="number"
                  min={1}
                  value={quantity}
                  aria-label={`Quantity for ${antique.title}`}
                  onChange={(event) =>
                    updateQuantity(antique.id, Number(event.target.value))
                  }
                />
                <button
                  className="btn btn-link"
                  type="button"
                  aria-label={`Remove ${antique.title} from cart`}
                  onClick={() => removeFromCart(antique.id)}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
          <div className="cart-total">
            <span>{t("estimatedTotal")}</span>
            <strong>EUR {total.toFixed(2)}</strong>
            <button
              className="btn btn-dark"
              type="button"
              onClick={startCheckout}
            >
              {t("payWithStripe")} <ArrowRight size={16} />
            </button>
          </div>
          {checkoutError && (
            <p className="checkout-error">{checkoutError}</p>
          )}
        </>
      )}
    </section>
  );
}

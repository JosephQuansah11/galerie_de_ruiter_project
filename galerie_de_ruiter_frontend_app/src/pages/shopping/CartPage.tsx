import { Button } from "@/components/ReactButton";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShopping } from "@/context/ShoppingContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatEuroAmount } from "@/i18n";
import { CartItems } from "./cart/CartItems";

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
          <CartItems items={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />
          <div className="cart-total">
            <span>{t("estimatedTotal")}</span>
            <strong>{formatEuroAmount(total, locale)}</strong>
          </div>
        </>
      )}
    </section>
  );
}

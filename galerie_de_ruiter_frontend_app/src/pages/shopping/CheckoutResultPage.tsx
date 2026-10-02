import { CheckCircle2, XCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CheckoutResultPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const successful = useLocation().pathname.endsWith("success");

  return (
    <section className="checkout-result">
      <div className="checkout-result-icon">
        {successful ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
      </div>
      <h1>{successful ? t("paymentReceived") : t("paymentCancelled")}</h1>
      <p>
        {successful
          ? t("paymentSuccessText")
          : t("paymentCancelledText")}
      </p>
      <button
        className="btn btn-dark"
        type="button"
        onClick={() => navigate(successful ? "/antiques" : "/cart")}
      >
        {successful ? t("continueBrowsing") : t("returnToCart")}
      </button>
    </section>
  );
}

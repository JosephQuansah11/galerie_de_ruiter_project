import { CheckCircle2, XCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function CheckoutResultPage() {
  const navigate = useNavigate();
  const successful = useLocation().pathname.endsWith("success");

  return (
    <section className="checkout-result">
      <div className="checkout-result-icon">
        {successful ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
      </div>
      <h1>{successful ? "Payment received" : "Payment cancelled"}</h1>
      <p>
        {successful
          ? "Thank you. Your payment was completed securely through Stripe."
          : "Your payment was cancelled. Your cart is still available."}
      </p>
      <button
        className="btn btn-dark"
        type="button"
        onClick={() => navigate(successful ? "/antiques" : "/cart")}
      >
        {successful ? "Continue browsing" : "Return to cart"}
      </button>
    </section>
  );
}

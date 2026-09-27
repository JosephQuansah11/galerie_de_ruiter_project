import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShopping } from "@/context/ShoppingContext";
import { useLanguage } from "@/context/LanguageContext";

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, addToCart } = useShopping();
  const { t } = useLanguage();
  return (
    <section className="shopping-page">
      <div className="shopping-heading"><div><span className="catalogue-artist">{t("wishlist")}</span><h1>{t("wishlist")}</h1></div><Heart size={32} /></div>
      {wishlist.length === 0 ? <div className="catalogue-state"><Heart size={28} /><span>Your saved pieces will appear here.</span></div> : <div className="shopping-list">
        {wishlist.map((antique) => (
          <article className="shopping-row" key={antique.id}>
            <div className="shopping-thumb">{antique.title.slice(0, 1)}</div>
            <div className="shopping-row-copy">
              <span className="catalogue-artist">
                {antique.artist?.displayName ?? antique.artist?.name ?? "Galerie collection"}
              </span>
              <h2>{antique.title}</h2>
              <strong>{antique.price == null ? "Price on request" : `EUR ${antique.price.toFixed(2)}`}</strong>
            </div>
            <div className="shopping-row-actions">
              <button className="btn btn-dark btn-sm" type="button" onClick={() => addToCart(antique)}>
                <ShoppingBag size={15} /> Add to cart
              </button>
              <button className="btn btn-link" type="button" aria-label={`Remove ${antique.title} from wishlist`} onClick={() => toggleWishlist(antique)}>
                <Trash2 size={17} />
              </button>
              <button className="btn btn-link" type="button" onClick={() => navigate(`/antiques/${antique.id}`)}>
                View
              </button>
            </div>
          </article>
        ))}
      </div>}
    </section>
  );
}
import { useRef } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { JumpToBottom } from "@/components/JumpToBottom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShopping } from "@/context/ShoppingContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatEuroAmount } from "@/i18n";
import { resolveAntiqueThumbnailUrl } from "@/models/antiques/Antique";

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, wishlistLoading, wishlistError, refreshWishlist, toggleWishlist, addToCart } = useShopping();
  const { t, locale } = useLanguage();
  const listRef = useRef<HTMLDivElement>(null);
  return (
    <section className="shopping-page">
      <div className="shopping-heading"><div><span className="catalogue-artist">{t("wishlist")}</span><h1>{t("wishlist")}</h1></div><Heart size={32} /></div>
      <p className="shopping-gallery-note">{t("wishlistGalleryNote")}</p>
      {wishlistError && <Alert variant="danger">
        <div className="shopping-error">
          <span>{t(wishlistError)}</span>
          <Button as="button" className="btn btn-outline-secondary btn-sm" type="button"
            onClick={() => void refreshWishlist()}>{t("wishlistRetry")}</Button>
        </div>
      </Alert>}
      {wishlistLoading && <div className="catalogue-state"><Spinner animation="border" size="sm" /> {t("wishlistLoading")}</div>}
      {!wishlistLoading && !wishlistError && (wishlist.length === 0
        ? <div className="catalogue-state"><Heart size={28} /><span>{t("wishlistEmpty")}</span></div>
        : <><div className="shopping-list" ref={listRef}>
          {wishlist.map((antique) => (
            <article className="shopping-row" key={antique.id}>
              <div className="shopping-thumb">{(antique.imageUrl ?? antique.imageUrls?.[0])
                ? <img src={resolveAntiqueThumbnailUrl(antique.imageUrl ?? antique.imageUrls?.[0])} alt="" loading="lazy" decoding="async" width={400} height={400} />
                : antique.title.slice(0, 1)}</div>
              <div className="shopping-row-copy">
                <span className="catalogue-artist">
                  {antique.artist?.displayName ?? antique.artist?.name ?? t("galerieCollection")}
                </span>
                <h2>{antique.title}</h2>
                <strong>{antique.price == null ? t("priceOnRequest") : formatEuroAmount(antique.price, locale)}</strong>
              </div>
              <div className="shopping-row-actions">
                <Button as="button" className="btn btn-dark btn-sm" type="button" onClick={() => addToCart(antique)}>
                  <ShoppingBag size={15} /> {t("addToCartShort")}
                </Button>
                <Button as="button" className="btn btn-link" type="button" aria-label={t("removeFromWishlist", { title: antique.title })} onClick={() => void toggleWishlist(antique)}>
                  <Trash2 size={17} />
                </Button>
                <Button as="button" className="btn btn-link" type="button" onClick={() => navigate(`/antiques/${antique.id}`)}>
                  {t("view")}
                </Button>
              </div>
            </article>
          ))}
        </div>
        <JumpToBottom itemCount={wishlist.length} targetRef={listRef} /></>)}
    </section>
  );
}
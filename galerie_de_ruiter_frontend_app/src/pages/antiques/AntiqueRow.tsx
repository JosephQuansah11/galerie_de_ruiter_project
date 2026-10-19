import { Badge } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useShopping } from "@/context/ShoppingContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatEuroAmount } from "@/i18n";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueMediumUrl, resolveAntiqueThumbnailUrl } from "@/models/antiques/Antique";
import { summarizeDescription } from "./summarizeDescription";

/**
 * One piece in the catalogue, laid out as a compact row: a small thumbnail with the piece's
 * short story beside it. The description is trimmed to a preview here; the full story stays
 * on the piece's own page.
 *
 * The list is open to a visitor without an account; saving a piece and putting it in the basket
 * are not. Those two buttons send the visitor to the sign-in page with this list as the page to
 * come back to, which is the same `from` the route guard passes (see src/ProtectedRoutes.tsx).
 */
export function AntiqueRow({ antique }: { antique: Antique }) {
  const navigate = useNavigate();
  const location = useLocation();
  const shopping = useShopping();
  const { authenticated } = useAuth();
  const { t, locale } = useLanguage();
  const artist = antique.artist?.displayName ?? antique.artist?.name ?? t("galerieCollection");
  const price = antique.price == null ? t("priceOnRequest") : formatEuroAmount(antique.price, locale);
  const description = summarizeDescription(antique.description);
  const imageUrl = antique.imageUrl ?? antique.imageUrls?.[0];
  const thumbnailUrl = resolveAntiqueThumbnailUrl(imageUrl);
  const mediumUrl = resolveAntiqueMediumUrl(imageUrl);
  /** Runs the action for an account, and asks for one otherwise. */
  const withAccount = (action: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (authenticated) action();
    else navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
  };
  return <article className={`catalogue-card catalogue-row${antique.sold ? " is-sold" : ""}`} onClick={() => navigate(`/antiques/${antique.id}`)}>
    <div className="catalogue-card-image" aria-hidden="true">{imageUrl ? <img
      src={thumbnailUrl}
      srcSet={thumbnailUrl && mediumUrl ? `${thumbnailUrl} 400w, ${mediumUrl} 800w` : undefined}
      sizes="(max-width: 700px) 92vw, 360px"
      alt=""
      loading="lazy"
      decoding="async"
      width={800}
      height={600}
    /> : antique.title.slice(0, 1).toUpperCase()}
      {antique.sold && <span className="catalogue-sold-badge">{t("sold")}</span>}</div>
    <div className="catalogue-card-content">
      <span className="catalogue-artist">{artist}</span>
      <h2><Link className="catalogue-card-title" to={`/antiques/${antique.id}`}
        onClick={(event) => event.stopPropagation()}>{antique.title}</Link></h2>
      <p className="catalogue-row-description">{description || t("storyWaiting")}</p>
      <div className="catalogue-row-meta">
        <span><Eye size={14} /> {t("viewsCountLabel", { count: antique.viewCount ?? 0 })}</span>
        <span><Heart size={14} /> {t("likesCountLabel", { count: antique.likeCount ?? 0 })}</span>
      </div>
      <div className="catalogue-card-footer"><strong>{price}</strong><div className="catalogue-card-actions">
        {antique.sold
          ? <Badge bg="dark" className="catalogue-sold-pill"><ShoppingBag size={14} /> {t("sold")}</Badge>
          : <Button className="btn btn-sm btn-outline-dark" type="button" onClick={withAccount(() => shopping.addToCart(antique))} text={<><ShoppingBag size={15} /> {t("add")}</>} />}
        <Button className="btn btn-sm btn-link" type="button" aria-label={t("savePieceNamed", { title: antique.title })} onClick={withAccount(() => shopping.toggleWishlist(antique))} text={<Heart size={18} fill={shopping.isWishlisted(antique.id) ? "currentColor" : "none"} />} />
      </div></div>
    </div>
  </article>;
}

import { Button } from "@/components/ReactButton";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShopping } from "@/context/ShoppingContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatEuroAmount } from "@/i18n";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";

export function AntiqueCard({ antique }: { antique: Antique }) {
  const navigate = useNavigate();
  const shopping = useShopping();
  const { t, locale } = useLanguage();
  const artist = antique.artist?.displayName ?? antique.artist?.name ?? t("galerieCollection");
  const price = antique.price == null ? t("priceOnRequest") : formatEuroAmount(antique.price, locale);
  return <article className="catalogue-card" onClick={() => navigate(`/antiques/${antique.id}`)}>
    <div className="catalogue-card-image" aria-hidden="true">{(antique.imageUrl ?? antique.imageUrls?.[0]) ? <img src={resolveAntiqueImageUrl(antique.imageUrl ?? antique.imageUrls?.[0])} alt="" /> : antique.title.slice(0, 1).toUpperCase()}</div>
    <div className="catalogue-card-content"><span className="catalogue-artist">{artist}</span><h2>{antique.title}</h2><p>{antique.description || t("storyWaiting")}</p>
      <div className="d-flex gap-3 small text-secondary"><span className="d-inline-flex align-items-center gap-1">
        <Eye size={14} /> {t("viewsCountLabel", { count: antique.viewCount ?? 0 })}</span><span className="d-inline-flex align-items-center gap-1">
        <Heart size={14} /> {t("likesCountLabel", { count: antique.likeCount ?? 0 })}</span></div>
      <div className="catalogue-card-footer"><strong>{price}</strong><div className="catalogue-card-actions">
        <Button className="btn btn-sm btn-outline-dark" type="button" onClick={(event) => { event.stopPropagation(); shopping.addToCart(antique); }} text={<><ShoppingBag size={15} /> {t("add")}</>} />
        <Button className="btn btn-sm btn-link" type="button" aria-label={t("savePieceNamed", { title: antique.title })} onClick={(event) => { event.stopPropagation(); shopping.toggleWishlist(antique); }} text={<Heart size={18} fill={shopping.isWishlisted(antique.id) ? "currentColor" : "none"} />} />
      </div></div>
    </div>
  </article>;
}

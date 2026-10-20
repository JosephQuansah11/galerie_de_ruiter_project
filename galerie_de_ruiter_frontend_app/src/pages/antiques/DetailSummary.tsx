import { Badge } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Eye, Heart, ShoppingBag, UserRound } from "lucide-react";
import type Antique from "@/models/antiques/Antique";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";
import type { Translate } from "./detailTypes";
import { useAntiqueEngagement } from "./useAntiqueEngagement";

type Props = { antique: Antique; artist: string; price: string; wishlisted: boolean;
  addToCart: () => void; toggleWishlist: () => void; t: Translate };
export function DetailSummary({ antique, artist, price, wishlisted, addToCart, toggleWishlist, t }: Props) {
  const engagement = useAntiqueEngagement(antique);
  const auth = useAuth();
  const location = useLocation();
  // The piece's page is public, the actions are not: saving, buying and liking ask for the account
  // the catalogue's cards already ask for, and the sign-in page remembers this piece.
  const withAccount = (action: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (auth.authenticated) action();
    else auth.login(`${location.pathname}${location.search}`);
  };
  return <><Badge bg="dark" className="catalogue-kicker">OBJECT / {antique.id.slice(0, 8)}</Badge>
    {antique.sold && <Badge bg="dark" className="detail-sold-badge">{t("sold")}</Badge>}
    <span className="catalogue-artist">{artist}</span><h1>{antique.title}</h1>
    <p className="detail-description">{antique.description || t("consideredPiece")}</p>
    <div className="detail-facts"><span>{t("condition")}</span><strong>{antique.sold ? t("sold") : t("availableToDiscuss")}</strong>
      <span>{t("ownership")}</span><strong>{t("galerieDeRuiter")}</strong><span>{t("price")}</span><strong>{price}</strong></div>
    <div className="detail-actions">
      <Button className={`btn ${antique.sold ? "btn-secondary" : "btn-dark"}`} type="button" onClick={withAccount(addToCart)} disabled={antique.sold}><ShoppingBag size={17} /> {antique.sold ? t("sold") : t("addToCart")}</Button>
      <Button className={`btn btn-${wishlisted ? "danger" : "outline-dark"}`} type="button" onClick={withAccount(toggleWishlist)}>
        <Heart size={17} fill={wishlisted ? "currentColor" : "none"} /> {wishlisted ? t("interestSaved") : t("interestSave")}</Button>
      <Button className={`btn btn-${engagement.liked ? "danger" : "outline-dark"}`} type="button" disabled={engagement.busy}
        aria-pressed={engagement.liked} onClick={withAccount(() => void engagement.toggleLike())}>
        <Heart size={17} fill={engagement.liked ? "currentColor" : "none"} /> {engagement.liked ? t("likedPiece") : t("likePiece")}</Button>
    </div>
    <div className="d-flex gap-3 small text-secondary mt-3" aria-live="polite">
      <span className="d-inline-flex align-items-center gap-1"><Eye size={15} /> {t("viewsCountLabel", { count: engagement.viewCount })}</span>
      <span className="d-inline-flex align-items-center gap-1"><Heart size={15} /> {t("likesCountLabel", { count: engagement.likeCount })}</span>
    </div>
    <p className="detail-note"><UserRound size={16} /> {t("purchaseNote")}</p>
  </>;
}

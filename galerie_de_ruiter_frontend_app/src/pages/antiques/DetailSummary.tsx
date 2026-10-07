import { Badge } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Heart, ShoppingBag, UserRound } from "lucide-react";
import type Antique from "@/models/antiques/Antique";
import type { Translate } from "./detailTypes";

type Props = { antique: Antique; artist: string; price: string; wishlisted: boolean;
  addToCart: () => void; toggleWishlist: () => void; t: Translate };
export function DetailSummary({ antique, artist, price, wishlisted, addToCart, toggleWishlist, t }: Props) {
  return <><Badge bg="dark" className="catalogue-kicker">OBJECT / {antique.id.slice(0, 8)}</Badge>
    <span className="catalogue-artist">{artist}</span><h1>{antique.title}</h1>
    <p className="detail-description">{antique.description || t("consideredPiece")}</p>
    <div className="detail-facts"><span>{t("condition")}</span><strong>{t("availableToDiscuss")}</strong>
      <span>{t("ownership")}</span><strong>{t("galerieDeRuiter")}</strong><span>{t("price")}</span><strong>{price}</strong></div>
    <div className="detail-actions">
      <Button className="btn btn-dark" type="button" onClick={addToCart}><ShoppingBag size={17} /> {t("addToCart")}</Button>
      <Button className={`btn btn-${wishlisted ? "danger" : "outline-dark"}`} type="button" onClick={toggleWishlist}>
        <Heart size={17} fill={wishlisted ? "currentColor" : "none"} /> {wishlisted ? t("saved") : t("savePiece")}</Button>
    </div><p className="detail-note"><UserRound size={16} /> {t("purchaseNote")}</p>
  </>;
}

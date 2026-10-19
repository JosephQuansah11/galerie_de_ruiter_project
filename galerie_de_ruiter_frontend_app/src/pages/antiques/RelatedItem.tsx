import { Link } from "react-router-dom";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueThumbnailUrl } from "@/models/antiques/Antique";
import { formatEuroAmount } from "@/i18n";
import type { Translate } from "./detailTypes";

/**
 * One piece in the strip under a piece's own page.
 *
 * It is a real link, not a button: a crawler follows an `href`, and the strip is how one piece
 * leads to another. The click still goes through `select`, so the page keeps its in-app
 * navigation; the `href` is what a crawler and a middle-click use.
 */
export function RelatedItem({ antique, locale, t, select }: { antique: Antique; locale: string;
  t: Translate; select: (id: string) => void }) {
  const image = antique.imageUrls?.[0] ?? antique.imageUrl;
  return <Link className="detail-related-item" to={`/antiques/${antique.id}`}
    onClick={(event) => { event.preventDefault(); select(antique.id); }}>
    <span className="detail-related-image">{image ? <img src={resolveAntiqueThumbnailUrl(image)} alt="" loading="lazy" decoding="async" width={400} height={300} /> : antique.title.slice(0, 1).toUpperCase()}</span>
    <span className="detail-related-name">{antique.title}</span>
    <span className="detail-related-price">{antique.price == null ? t("priceOnRequest") : formatEuroAmount(antique.price, locale)}</span>
  </Link>;
}

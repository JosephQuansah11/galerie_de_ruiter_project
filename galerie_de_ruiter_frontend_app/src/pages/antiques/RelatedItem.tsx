import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { formatEuroAmount } from "@/i18n";
import type { Translate } from "./detailTypes";

/**
 * One piece in the strip under a piece's own page.
 *
 * This is a plain button rather than the Bootstrap `Button` wrapper: the wrapper's `btn`
 * classes drag the site-wide button look (bordeaux fill, centred items, uppercase label)
 * into the card, which pushed the title outside the card's edges. The card's own
 * `.detail-related-item` rules own its look instead.
 */
export function RelatedItem({ antique, locale, t, select }: { antique: Antique; locale: string;
  t: Translate; select: (id: string) => void }) {
  const image = antique.imageUrls?.[0] ?? antique.imageUrl;
  return <button className="detail-related-item" type="button" onClick={() => select(antique.id)}>
    <span className="detail-related-image">{image ? <img src={resolveAntiqueImageUrl(image)} alt="" loading="lazy" /> : antique.title.slice(0, 1).toUpperCase()}</span>
    <span className="detail-related-name">{antique.title}</span>
    <span className="detail-related-price">{antique.price == null ? t("priceOnRequest") : formatEuroAmount(antique.price, locale)}</span>
  </button>;
}

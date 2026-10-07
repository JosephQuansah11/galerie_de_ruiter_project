import { Button } from "@/components/ReactButton";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { formatEuroAmount } from "@/i18n";
import type { Translate } from "./detailTypes";

export function RelatedItem({ antique, locale, t, select }: { antique: Antique; locale: string;
  t: Translate; select: (id: string) => void }) {
  const image = antique.imageUrls?.[0] ?? antique.imageUrl;
  return <Button className="detail-related-item" type="button" onClick={() => select(antique.id)}>
    <span className="detail-related-image">{image ? <img src={resolveAntiqueImageUrl(image)} alt="" loading="lazy" /> : antique.title.slice(0, 1).toUpperCase()}</span>
    <span className="detail-related-name">{antique.title}</span>
    <span className="detail-related-price">{antique.price == null ? t("priceOnRequest") : formatEuroAmount(antique.price, locale)}</span>
  </Button>;
}

import { Button } from "@/components/ReactButton";
import { Image } from "lucide-react";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { formatEuroAmount } from "@/i18n";

type Props = { antiques: Antique[]; onSelect: (antique: Antique) => void; uncategorized: string; priceOnRequest: string; locale: string };
export function InventoryList({ antiques, onSelect, uncategorized, priceOnRequest, locale }: Props) {
  return <div className="inventory-list">{antiques.map((antique) =>
    <Button className="inventory-row" key={antique.id} type="button" onClick={() => onSelect(antique)}>
      {antique.imageUrl ? <img src={resolveAntiqueImageUrl(antique.imageUrl)} alt="" />
        : <span className="inventory-placeholder"><Image size={20} /></span>}
      <span><strong>{antique.title}</strong><small>{antique.category ?? uncategorized} ·{" "}
        {antique.price == null ? priceOnRequest : formatEuroAmount(antique.price, locale)}</small></span>
    </Button>)}</div>;
}

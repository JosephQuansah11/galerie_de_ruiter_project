import { Button } from "@/components/ReactButton";
import { Image, Pencil, Trash2 } from "lucide-react";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { formatEuroAmount } from "@/i18n";

type Props = {
  antiques: Antique[];
  onEdit: (antique: Antique) => void;
  onDelete: (antique: Antique) => void;
  deletingId?: string;
  uncategorized: string;
  priceOnRequest: string;
  locale: string;
  editLabel: string;
  deleteLabel: string;
};
export function InventoryList({ antiques, onEdit, onDelete, deletingId, uncategorized, priceOnRequest, locale, editLabel, deleteLabel }: Props) {
  return <div className="inventory-list">{antiques.map((antique) =>
    <article className="inventory-row" key={antique.id}>
      <span className="inventory-thumb">
        {antique.imageUrl ? <img src={resolveAntiqueImageUrl(antique.imageUrl)} alt="" />
          : <span className="inventory-placeholder"><Image size={20} /></span>}
      </span>
      <span className="inventory-row-copy">
        <strong>{antique.title}</strong>
        <small>{antique.category ?? uncategorized} ·{" "}
          {antique.price == null ? priceOnRequest : formatEuroAmount(antique.price, locale)}</small>
        {antique.description && <span className="inventory-description">{antique.description}</span>}
      </span>
      <span className="inventory-row-actions">
        <Button className="btn btn-outline-primary" type="button" aria-label={`${editLabel}: ${antique.title}`}
          onClick={() => onEdit(antique)}><Pencil size={16} />{editLabel}</Button>
        <Button className="btn btn-outline-danger" type="button" aria-label={`${deleteLabel}: ${antique.title}`}
          disabled={deletingId === antique.id} onClick={() => onDelete(antique)}><Trash2 size={16} />{deleteLabel}</Button>
      </span>
    </article>)}</div>;
}

import { Badge } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { BadgeCheck, Image, Pencil, Trash2, Undo2 } from "lucide-react";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { formatEuroAmount } from "@/i18n";

type Props = {
  antiques: Antique[];
  onEdit: (antique: Antique) => void;
  onDelete: (antique: Antique) => void;
  onToggleSold: (antique: Antique) => void;
  deletingId?: string;
  soldSavingId?: string;
  uncategorized: string;
  priceOnRequest: string;
  locale: string;
  editLabel: string;
  deleteLabel: string;
  soldLabel: string;
  markSoldLabel: string;
  markAvailableLabel: string;
};
export function InventoryList({ antiques, onEdit, onDelete, onToggleSold, deletingId, soldSavingId,
  uncategorized, priceOnRequest, locale, editLabel, deleteLabel, soldLabel, markSoldLabel, markAvailableLabel }: Props) {
  return <div className="inventory-list">{antiques.map((antique) =>
    <article className={`inventory-row${antique.sold ? " is-sold" : ""}`} key={antique.id}>
      <span className="inventory-thumb">
        {antique.imageUrl ? <img src={resolveAntiqueImageUrl(antique.imageUrl)} alt="" width={400} height={300} />
          : <span className="inventory-placeholder"><Image size={20} /></span>}
      </span>
      <span className="inventory-row-copy">
        <strong>{antique.title}{antique.sold && <Badge bg="dark" className="inventory-sold-badge">{soldLabel}</Badge>}</strong>
        <small>{antique.category ?? uncategorized} ·{" "}
          {antique.price == null ? priceOnRequest : formatEuroAmount(antique.price, locale)}</small>
        {antique.description && <span className="inventory-description">{antique.description}</span>}
      </span>
      <span className="inventory-row-actions">
        <Button className={`btn ${antique.sold ? "btn-outline-secondary" : "btn-outline-success"}`} type="button"
          aria-label={`${antique.sold ? markAvailableLabel : markSoldLabel}: ${antique.title}`}
          disabled={soldSavingId === antique.id} onClick={() => onToggleSold(antique)}>
          {antique.sold ? <><Undo2 size={16} />{markAvailableLabel}</> : <><BadgeCheck size={16} />{markSoldLabel}</>}
        </Button>
        <Button className="btn btn-outline-primary" type="button" aria-label={`${editLabel}: ${antique.title}`}
          onClick={() => onEdit(antique)}><Pencil size={16} />{editLabel}</Button>
        <Button className="btn btn-outline-danger" type="button" aria-label={`${deleteLabel}: ${antique.title}`}
          disabled={deletingId === antique.id} onClick={() => onDelete(antique)}><Trash2 size={16} />{deleteLabel}</Button>
      </span>
    </article>)}</div>;
}

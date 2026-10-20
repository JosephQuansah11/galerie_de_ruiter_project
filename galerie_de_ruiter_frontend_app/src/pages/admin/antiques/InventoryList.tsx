import type { RefObject } from "react";
import { Badge, Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { BadgeCheck, Image, Pencil, Trash2, Undo2 } from "lucide-react";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueThumbnailUrl } from "@/models/antiques/Antique";
import { formatEuroAmount } from "@/i18n";

type Props = {
  antiques: Antique[];
  onEdit: (antique: Antique) => void;
  onDelete: (antique: Antique) => void;
  onToggleSold: (antique: Antique) => void;
  selectedIds: ReadonlySet<string>;
  onSelect: (id: string, selected: boolean) => void;
  selectLabel: (title: string) => string;
  selectDisabled?: boolean;
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
  /** The list itself, so a shortcut can bring its last row into view. */
  listRef?: RefObject<HTMLDivElement | null>;
};
export function InventoryList({ antiques, onEdit, onDelete, onToggleSold, selectedIds, onSelect, selectLabel,
  selectDisabled, deletingId, soldSavingId, uncategorized, priceOnRequest, locale, editLabel, deleteLabel,
  soldLabel, markSoldLabel, markAvailableLabel, listRef }: Props) {
  return <div className="inventory-list" ref={listRef}>{antiques.map((antique) =>
    <article className={`inventory-row${antique.sold ? " is-sold" : ""}${selectedIds.has(antique.id) ? " is-selected" : ""}`} key={antique.id}>
      <Form.Check className="inventory-select" type="checkbox" checked={selectedIds.has(antique.id)}
        disabled={selectDisabled} aria-label={selectLabel(antique.title)}
        onChange={(event) => onSelect(antique.id, event.target.checked)} />
      <span className="inventory-thumb">
        {antique.imageUrl ? <img src={resolveAntiqueThumbnailUrl(antique.imageUrl)} alt="" loading="lazy" decoding="async" width={400} height={300} />
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

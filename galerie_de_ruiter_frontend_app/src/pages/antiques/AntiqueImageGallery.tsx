import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";

/** One photograph in the gallery: an id, a preview URL and optional alt text. */
export type GalleryImage = { id: string; url: string; alt?: string };

type Props = {
  images: GalleryImage[];
  /** Moves a photograph one place earlier (`-1`) or later (`1`). Omit to hide the controls. */
  onMove?: (id: string, direction: -1 | 1) => void;
  /** Removes a photograph. Omit to hide the control. */
  onRemove?: (id: string) => void;
  /** Marks a photograph that is not stored yet, so it reads as new. */
  isNew?: (id: string) => boolean;
};

/**
 * The main preview plus a strip of thumbnails — the same shape the piece's own page uses. The
 * first photograph is the one the catalogue shows large, so moving a picture to the front is
 * how the gallery picks the main image.
 */
export function AntiqueImageGallery({ images, onMove, onRemove, isNew }: Props) {
  const { t } = useTranslation();
  if (images.length === 0) return null;
  const [main] = images;
  return <div className="antique-gallery">
    <div className="antique-gallery-main">
      <img src={main.url} alt={main.alt ?? ""} width={800} height={600} />
      {images.length > 1 && <span className="antique-gallery-count">{t("imageNumber", { number: 1, total: images.length })}</span>}
    </div>
    <ul className="antique-gallery-strip">
      {images.map((image, index) => <li key={image.id}
        className={`antique-gallery-item${index === 0 ? " is-main" : ""}${isNew?.(image.id) ? " is-new" : ""}`}>
        <span className="antique-gallery-thumb">
          <img src={image.url} alt={image.alt ?? ""} width={400} height={400} />
        </span>
        <span className="antique-gallery-position" aria-hidden="true">{index + 1}</span>
        {isNew?.(image.id) && <span className="antique-image-new-badge">{t("newPhoto")}</span>}
        {onMove && <span className="antique-gallery-move">
          <button type="button" disabled={index === 0} onClick={() => onMove(image.id, -1)}
            aria-label={t("moveImageEarlier", { number: index + 1 })}>
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <button type="button" disabled={index === images.length - 1} onClick={() => onMove(image.id, 1)}
            aria-label={t("moveImageLater", { number: index + 1 })}>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </span>}
        {onRemove && <button type="button" className="antique-image-remove" onClick={() => onRemove(image.id)}
          aria-label={t("removeImageNumber", { number: index + 1 })}>
          <X size={14} aria-hidden="true" />
        </button>}
      </li>)}
    </ul>
  </div>;
}

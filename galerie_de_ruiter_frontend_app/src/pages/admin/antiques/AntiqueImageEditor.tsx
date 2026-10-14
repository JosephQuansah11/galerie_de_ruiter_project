import { Form } from "react-bootstrap";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { antiqueImageIdFromUrl, resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import type { SelectedImage } from "@/pages/antiques/useImageSelection";

type Props = {
  /** Image paths already stored on the piece. */
  existingUrls: string[];
  /** Ids of the stored images the admin marked for removal. */
  removedIds: string[];
  onRemoveExisting: (imageId: string) => void;
  /** Images picked in this dialog and not uploaded yet. */
  newImages: SelectedImage[];
  onAddImages: (input: FileList | null) => void;
  onRemoveNew: (id: string) => void;
  disabled?: boolean;
};

/**
 * Lets the gallery change the photographs of an existing piece: stored images can be
 * removed and new ones picked, each shown as a thumbnail before the piece is saved.
 */
export function AntiqueImageEditor({ existingUrls, removedIds, onRemoveExisting, newImages, onAddImages, onRemoveNew, disabled }: Props) {
  const { t } = useTranslation();
  const keptExisting = existingUrls.filter((url) => {
    const imageId = antiqueImageIdFromUrl(url);
    return !imageId || !removedIds.includes(imageId);
  });
  const total = keptExisting.length + newImages.length;
  return <Form.Group className="mb-3">
    <Form.Label>{t("editAntiqueImages")}</Form.Label>
    <Form.Control type="file" accept="image/*" multiple disabled={disabled} onChange={(event) => {
      const input = event.currentTarget as HTMLInputElement;
      onAddImages(input.files);
      // Clear the picker so the same file can be chosen again and more images can be added.
      input.value = "";
    }} />
    <Form.Text>{total ? t("selectedImageCount", { count: total }) : t("chooseImages")}</Form.Text>
    {/* Stored images and freshly picked ones appear together, so the admin sees the result
        of a removal or an addition before saving. */}
    {(keptExisting.length > 0 || newImages.length > 0) && <ul className="antique-image-previews">
      {keptExisting.map((url, index) => {
        const imageId = antiqueImageIdFromUrl(url);
        return <li key={url} className="antique-image-preview">
          <img src={resolveAntiqueImageUrl(url)} alt="" />
          <span className="antique-image-position" aria-hidden="true">{index + 1}</span>
          {imageId && <button type="button" className="antique-image-remove" disabled={disabled}
            onClick={() => onRemoveExisting(imageId)}
            aria-label={t("removeImageNumber", { number: index + 1 })}>
            <X size={14} aria-hidden="true" />
          </button>}
        </li>;
      })}
      {newImages.map((image, index) => <li key={image.id} className="antique-image-preview is-new">
        <img src={image.url} alt={image.file.name} draggable={false} />
        <span className="antique-image-position" aria-hidden="true">{keptExisting.length + index + 1}</span>
        <span className="antique-image-new-badge">{t("newPhoto")}</span>
        <button type="button" className="antique-image-remove" disabled={disabled}
          onClick={() => onRemoveNew(image.id)}
          aria-label={t("removeImage", { name: image.file.name })}>
          <X size={14} aria-hidden="true" />
        </button>
      </li>)}
    </ul>}
  </Form.Group>;
}

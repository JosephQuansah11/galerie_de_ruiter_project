import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { AntiqueImageGallery } from "@/pages/antiques/AntiqueImageGallery";
import type { EditableImage } from "./useAntiqueImageEditing";

type Props = {
  /** The piece's photographs, stored and newly picked, in the gallery's order. */
  images: EditableImage[];
  onAddImages: (input: FileList | null) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onRemove: (key: string) => void;
  disabled?: boolean;
};

/**
 * Lets the gallery change the photographs of an existing piece: stored images can be removed or
 * moved, and new ones picked. The first photograph is the piece's main image.
 */
export function AntiqueImageEditor({ images, onAddImages, onMove, onRemove, disabled }: Props) {
  const { t } = useTranslation();
  const newKeys = new Set(images.filter((image) => image.file).map((image) => image.key));
  return <Form.Group className="mb-3" controlId="antique-image-editor-images">
    <Form.Label>{t("editAntiqueImages")}</Form.Label>
    <Form.Control type="file" accept="image/*" multiple disabled={disabled} onChange={(event) => {
      const input = event.currentTarget as HTMLInputElement;
      onAddImages(input.files);
      // Clear the picker so the same file can be chosen again and more images can be added.
      input.value = "";
    }} />
    <Form.Text>{images.length ? t("selectedImageCount", { count: images.length }) : t("chooseImages")}</Form.Text>
    <AntiqueImageGallery images={images.map((image) => ({ id: image.key, url: image.url }))}
      onMove={onMove} onRemove={onRemove} isNew={(key) => newKeys.has(key)} />
  </Form.Group>;
}


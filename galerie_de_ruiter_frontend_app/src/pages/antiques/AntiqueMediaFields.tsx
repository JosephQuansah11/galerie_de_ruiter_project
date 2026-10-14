import { Form } from "react-bootstrap";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { useNewAntiqueDraft } from "./useNewAntiqueDraft";
import { MODEL_MAX_SIZE_MB } from "./modelUploadLimits";

type Draft = ReturnType<typeof useNewAntiqueDraft>;
export function AntiqueMediaFields({ form, update, updateModelUrl, images, modelFileName, selectImages, removeImage, selectModelFile }: Pick<Draft, "form" | "update" | "images" | "modelFileName" | "selectImages" | "removeImage" | "selectModelFile"> & { updateModelUrl: (value: string) => void }) {
  const { t } = useTranslation();
  return <><Form.Group className="mb-3"><Form.Label>{t("uploadLocalImages")}</Form.Label>
    <Form.Control type="file" accept="image/*" multiple onChange={(event) => {
      const input = event.currentTarget as HTMLInputElement;
      selectImages(input.files);
      // Clear the picker so the same file can be chosen again and more images can be added.
      input.value = "";
    }} />
    <Form.Text>{images.length ? t("selectedImageCount", { count: images.length }) : t("chooseImages")}</Form.Text>
    {/* Thumbnails appear as soon as photographs are picked, before the piece is saved. */}
    {images.length > 0 && <ul className="antique-image-previews">
      {images.map((image, index) => <li key={image.id} className="antique-image-preview">
        <img src={image.url} alt={image.file.name} draggable={false} />
        <span className="antique-image-position" aria-hidden="true">{index + 1}</span>
        <button type="button" className="antique-image-remove" onClick={() => removeImage(image.id)}
          aria-label={t("removeImage", { name: image.file.name })}>
          <X size={14} aria-hidden="true" />
        </button>
      </li>)}
    </ul>}</Form.Group>
    <Form.Group className="mb-3"><Form.Label>{t("uploadGlbModel")}</Form.Label>
      <Form.Control type="file" accept=".glb,model/gltf-binary" onChange={(event) => selectModelFile((event.currentTarget as HTMLInputElement).files)} />
      <Form.Text>{modelFileName ? modelFileName : t("chooseGlbModel", { max: MODEL_MAX_SIZE_MB })}</Form.Text></Form.Group>
    <Form.Group className="mb-3"><Form.Label>{t("modelUrl")}</Form.Label>
      <Form.Control type="url" value={form.modelUrl} onChange={(event) => updateModelUrl(event.target.value)} placeholder={t("modelUrlPlaceholder")} /></Form.Group>
  </>;
}

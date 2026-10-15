import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { useNewAntiqueDraft } from "./useNewAntiqueDraft";
import { AntiqueImageGallery } from "./AntiqueImageGallery";
import { MODEL_MAX_SIZE_MB } from "./modelUploadLimits";

type Draft = ReturnType<typeof useNewAntiqueDraft>;
export function AntiqueMediaFields({ form, updateModelUrl, images, modelFileName, selectImages, removeImage, moveImage, selectModelFile }: Pick<Draft, "form" | "images" | "modelFileName" | "selectImages" | "removeImage" | "moveImage" | "selectModelFile"> & { updateModelUrl: (value: string) => void }) {
  const { t } = useTranslation();
  return <><Form.Group className="mb-3" controlId="antique-images"><Form.Label>{t("uploadLocalImages")}</Form.Label>
    <Form.Control type="file" accept="image/*" multiple onChange={(event) => {
      const input = event.currentTarget as HTMLInputElement;
      selectImages(input.files);
      // Clear the picker so the same file can be chosen again and more images can be added.
      input.value = "";
    }} />
    <Form.Text>{images.length ? t("selectedImageCount", { count: images.length }) : t("chooseImages")}</Form.Text>
    {/* The first photograph is the one the catalogue shows large; the arrows move one forward. */}
    <AntiqueImageGallery images={images.map((image) => ({ id: image.id, url: image.url, alt: image.file.name }))}
      onMove={moveImage} onRemove={removeImage} /></Form.Group>
    <Form.Group className="mb-3" controlId="antique-model"><Form.Label>{t("uploadGlbModel")}</Form.Label>
      <Form.Control type="file" accept=".glb,model/gltf-binary" onChange={(event) => selectModelFile((event.currentTarget as HTMLInputElement).files)} />
      <Form.Text>{modelFileName ? modelFileName : t("chooseGlbModel", { max: MODEL_MAX_SIZE_MB })}</Form.Text></Form.Group>
    <Form.Group className="mb-3" controlId="antique-model-url"><Form.Label>{t("modelUrl")}</Form.Label>
      <Form.Control type="url" value={form.modelUrl} onChange={(event) => updateModelUrl(event.target.value)} placeholder={t("modelUrlPlaceholder")} /></Form.Group>
  </>;
}

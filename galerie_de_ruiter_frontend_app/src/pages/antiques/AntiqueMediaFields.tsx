import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { useNewAntiqueDraft } from "./useNewAntiqueDraft";

type Draft = ReturnType<typeof useNewAntiqueDraft>;
export function AntiqueMediaFields({ form, update, updateModelUrl, fileNames, modelFileName, selectImages, selectModelFile }: Pick<Draft, "form" | "update" | "fileNames" | "modelFileName" | "selectImages" | "selectModelFile"> & { updateModelUrl: (value: string) => void }) {
  const { t } = useTranslation();
  return <><Form.Group className="mb-3"><Form.Label>{t("uploadLocalImages")}</Form.Label>
    <Form.Control type="file" accept="image/*" multiple onChange={(event) => selectImages((event.currentTarget as HTMLInputElement).files)} />
    <Form.Text>{fileNames.length ? fileNames.join(", ") : t("chooseImages")}</Form.Text></Form.Group>
    <Form.Group className="mb-3"><Form.Label>{t("uploadGlbModel")}</Form.Label>
      <Form.Control type="file" accept=".glb,model/gltf-binary" onChange={(event) => selectModelFile((event.currentTarget as HTMLInputElement).files)} />
      <Form.Text>{modelFileName ? modelFileName : t("chooseGlbModel")}</Form.Text></Form.Group>
    <Form.Group className="mb-3"><Form.Label>{t("modelUrl")}</Form.Label>
      <Form.Control type="url" value={form.modelUrl} onChange={(event) => updateModelUrl(event.target.value)} placeholder={t("modelUrlPlaceholder")} /></Form.Group>
  </>;
}

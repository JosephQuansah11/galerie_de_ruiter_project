import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { useNewAntiqueDraft } from "./useNewAntiqueDraft";

type Draft = ReturnType<typeof useNewAntiqueDraft>;
export function AntiqueMediaFields({ form, update, fileNames, selectImages }: Pick<Draft, "form" | "update" | "fileNames" | "selectImages">) {
  const { t } = useTranslation();
  return <><Form.Group className="mb-3"><Form.Label>{t("uploadLocalImages")}</Form.Label>
    <Form.Control type="file" accept="image/*" multiple onChange={(event) => selectImages((event.currentTarget as HTMLInputElement).files)} />
    <Form.Text>{fileNames.length ? fileNames.join(", ") : t("chooseImages")}</Form.Text></Form.Group>
    <Form.Group className="mb-3"><Form.Label>{t("modelUrl")}</Form.Label>
      <Form.Control type="url" value={form.modelUrl} onChange={(event) => update("modelUrl", event.target.value)} placeholder={t("modelUrlPlaceholder")} /></Form.Group>
  </>;
}

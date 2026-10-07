import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { useNewAntiqueDraft } from "./useNewAntiqueDraft";

type Draft = ReturnType<typeof useNewAntiqueDraft>;
export function AntiqueDescriptionFields({ form, update }: Pick<Draft, "form" | "update">) {
  const { t } = useTranslation();
  return <><Form.Group className="mb-4"><Form.Label>{t("description")}</Form.Label>
    <Form.Control as="textarea" rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} /></Form.Group>
    <Form.Group className="mb-4"><Form.Label>{t("priceEur")}</Form.Label>
      <Form.Control required type="number" min="0" step="0.01" value={form.price}
        onChange={(event) => update("price", event.target.value)} /></Form.Group></>;
}

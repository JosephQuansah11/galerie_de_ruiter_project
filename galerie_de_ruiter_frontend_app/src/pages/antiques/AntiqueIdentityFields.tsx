import { Form } from "react-bootstrap";
import type { Category } from "@/models/antiques/Antique";
import type { useNewAntiqueDraft } from "./useNewAntiqueDraft";
import { useTranslation } from "react-i18next";

type Draft = ReturnType<typeof useNewAntiqueDraft>;
export function AntiqueIdentityFields({ form, update, categories }: { form: Draft["form"]; update: Draft["update"]; categories: Category[] }) {
  const { t } = useTranslation();
  return <><Form.Group className="mb-3"><Form.Label>{t("title")}</Form.Label>
    <Form.Control required value={form.title} onChange={(event) => update("title", event.target.value)} /></Form.Group>
    <Form.Group className="mb-3"><Form.Label>{t("category")}</Form.Label>
      <Form.Select required value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)}>
        <option value="">{t("chooseCategory")}</option>{categories.flatMap((category) => [
          <option key={category.id} value={category.id}>{category.name}</option>,
          ...category.children.map((child) => <option key={child.id} value={child.id}>{category.name} / {child.name}</option>),
        ])}</Form.Select>
    </Form.Group></>;
}

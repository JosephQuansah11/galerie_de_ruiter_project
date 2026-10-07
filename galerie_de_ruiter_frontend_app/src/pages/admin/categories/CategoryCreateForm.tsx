import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Plus } from "lucide-react";
import type { Category } from "@/models/antiques/Antique";
import type { useCategoryAdmin } from "./useCategoryAdmin";
import { useTranslation } from "react-i18next";

type Props = Pick<ReturnType<typeof useCategoryAdmin>, "name" | "setName" | "parentId" | "setParentId" | "addCategory"> & { categories: Category[] };
export function CategoryCreateForm({ name, setName, parentId, setParentId, addCategory, categories }: Props) {
  const { t } = useTranslation();
  return <Form className="category-create-form" onSubmit={addCategory}>
    <Form.Control required value={name} onChange={(event) => setName(event.target.value)} placeholder={t("newCategoryName")} />
    <Form.Select value={parentId} onChange={(event) => setParentId(event.target.value)}>
      <option value="">{t("topLevelCategory")}</option>
      {categories.map((category) => <option key={category.id} value={category.id}>{t("subcategoryOf")} {category.name}</option>)}
    </Form.Select>
    <Button className="btn btn-primary" type="submit"><Plus size={16} /> {t("addCategory")}</Button>
  </Form>;
}

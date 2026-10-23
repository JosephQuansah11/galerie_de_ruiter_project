import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { CornerDownRight, Eye, EyeOff, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Category } from "@/models/antiques/Antique";

type Props = { category: Category; depth?: number; toggle: (category: Category) => void; remove: (id: string) => void };
export function CategoryRow({ category, depth = 0, toggle, remove }: Props) {
  const { t } = useTranslation();
  return <div className={`admin-row category-row${depth > 0 ? " is-subcategory" : ""}`}>
    <div className="category-row-title">
      {depth > 0 && <CornerDownRight className="category-row-branch" size={15} aria-hidden="true" />}
      <strong>{category.parentName ? `${category.parentName} / ${category.name}` : category.name}</strong>
      <span>{category.itemCount} {t("pieces")}</span>
    </div>
    <div className="admin-row-actions">
      <Form.Check type="switch" id={`category-${category.id}`} checked={category.visible}
        onChange={() => toggle(category)} label={category.visible
          ? <><Eye size={15} /> {t("visible")}</> : <><EyeOff size={15} /> {t("hidden")}</>} />
      <Button className="btn btn-link" type="button"
        aria-label={t("deleteCategoryNamed", { name: category.name })} onClick={() => remove(category.id)}>
        <Trash2 size={16} />
      </Button>
    </div>
  </div>;
}


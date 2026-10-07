import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Category } from "@/models/antiques/Antique";

type Props = { category: Category; toggle: (category: Category) => void; remove: (id: string) => void };
export function CategoryRow({ category, toggle, remove }: Props) {
  const { t } = useTranslation();
  return <div className="admin-row" key={category.id}>
    <div><strong>{category.name}</strong><span>{category.itemCount} {t("pieces")}</span></div>
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

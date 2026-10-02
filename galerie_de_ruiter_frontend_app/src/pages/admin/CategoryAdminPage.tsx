import { useEffect, useState, type FormEvent } from "react";
import { Alert, Form, Spinner } from "react-bootstrap";
import { Eye, EyeOff, ListTree, Plus, Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { publishContentUpdate } from "@/services/contentUpdates";

export default function CategoryAdminPage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [createError, setCreateError] = useState<string>();

  useEffect(() => {
    if (!auth.isAdmin) return;
    getAllCategories()
      .then(setCategories)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [auth.isAdmin]);

  const toggle = async (category: Category) => {
    const updated = await updateCategory({
      ...category,
      visible: !category.visible,
    });
    setCategories((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    publishContentUpdate("categories");
  };

  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreateError(undefined);
    try {
      const created = await createCategory(name.trim(), parentId || undefined);
      setCategories((current) => [...current, created]);
      publishContentUpdate("categories");
      setName("");
      setParentId("");
    } catch {
      setCreateError("categoryExists");
    }
  };

  const removeCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories((current) =>
      current.filter((category) => category.id !== id),
    );
    publishContentUpdate("categories");
  };

  if (!auth.isAdmin)
    return (
      <Alert variant="warning">{t("adminAccessRequired")}</Alert>
    );
  return (
    <section className="admin-page">
      <div className="shopping-heading">
        <div>
          <span className="catalogue-artist">{t("administration")}</span>
          <h1>{t("catalogueNavigation")}</h1>
        </div>
        <ListTree size={32} />
      </div>
      <p className="admin-intro">
        {t("categoryAdminIntro")}
      </p>
      <Form className="category-create-form" onSubmit={addCategory}>
        <Form.Control
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("newCategoryName")}
        />
        <Form.Select
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
        >
          <option value="">{t("topLevelCategory")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {t("subcategoryOf")} {category.name}
            </option>
          ))}
        </Form.Select>
        <button className="btn btn-primary" type="submit">
          <Plus size={16} /> {t("addCategory")}
        </button>
      </Form>
      {createError && <Alert variant="warning">{t(createError)}</Alert>}
      {loading && (
        <div className="catalogue-state">
          <Spinner animation="border" size="sm" /> {t("loadingCategories")}
        </div>
      )}
      {error && (
        <Alert variant="danger">{t("categoriesLoadError")}</Alert>
      )}
      <div className="admin-list">
        {categories.map((category) => (
          <div className="admin-row" key={category.id}>
            <div>
              <strong>{category.name}</strong>
              <span>
                {category.itemCount} {t("pieces")}
              </span>
            </div>
            <div className="admin-row-actions">
              <Form.Check
                type="switch"
                id={`category-${category.id}`}
                checked={category.visible}
                onChange={() => toggle(category)}
                label={
                  category.visible ? (
                    <>
                      <Eye size={15} /> {t("visible")}
                    </>
                  ) : (
                    <>
                      <EyeOff size={15} /> {t("hidden")}
                    </>
                  )
                }
              />
              <button
                className="btn btn-link"
                type="button"
                aria-label={t("deleteCategoryNamed", { name: category.name })}
                onClick={() => removeCategory(category.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

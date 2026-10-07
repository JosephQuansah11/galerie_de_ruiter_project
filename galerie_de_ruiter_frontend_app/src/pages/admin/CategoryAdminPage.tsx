import { Alert, Spinner } from "react-bootstrap";
import { ListTree } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useCategoryAdmin } from "./categories/useCategoryAdmin";
import { CategoryCreateForm } from "./categories/CategoryCreateForm";
import { CategoryList } from "./categories/CategoryList";

export default function CategoryAdminPage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const admin = useCategoryAdmin(auth.isAdmin);
  if (!auth.isAdmin) return <Alert variant="warning">{t("adminAccessRequired")}</Alert>;
  return <section className="admin-page">
    <div className="shopping-heading"><div><span className="catalogue-artist">{t("administration")}</span>
      <h1>{t("catalogueNavigation")}</h1></div><ListTree size={32} /></div>
    <p className="admin-intro">{t("categoryAdminIntro")}</p>
    <CategoryCreateForm {...admin} categories={admin.categories} />
    {admin.createError && <Alert variant="warning">{t(admin.createError)}</Alert>}
    {admin.loading && <div className="catalogue-state"><Spinner animation="border" size="sm" /> {t("loadingCategories")}</div>}
    {admin.error && <Alert variant="danger">{t("categoriesLoadError")}</Alert>}
    <CategoryList categories={admin.categories} toggle={admin.toggle} remove={admin.removeCategory} />
  </section>;
}

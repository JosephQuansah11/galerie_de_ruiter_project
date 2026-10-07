import { Alert, Spinner } from "react-bootstrap";
import { ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CatalogueStatus({ loading, error, categoriesLoading, categoriesError, empty, hasQuery }: {
  loading: boolean; error: boolean; categoriesLoading: boolean; categoriesError: boolean; empty: boolean; hasQuery: boolean;
}) {
  const { t } = useTranslation();
  return <>
    {loading && <div className="catalogue-state"><Spinner animation="border" size="sm" /> {t("loadingCollection")}</div>}
    {error && <Alert variant="danger">{t("collectionLoadError")}</Alert>}
    {categoriesLoading && <div className="catalogue-state"><Spinner animation="border" size="sm" /> {t("loadingCategories")}</div>}
    {categoriesError && <Alert variant="danger">{t("categoriesLoadError")}</Alert>}
    {!loading && !error && empty && <div className="catalogue-state"><ShoppingBag size={28} /><span>{t(hasQuery ? "noPiecesMatch" : "collectionWaiting")}</span></div>}
  </>;
}

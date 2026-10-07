import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllAntiques } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { InventoryList } from "./antiques/InventoryList";
import { InventoryHeading } from "./antiques/InventoryHeading";

export default function AntiqueAdminPage() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const [antiques, setAntiques] = useState<Antique[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    getAllAntiques()
      .then((items) => { setAntiques(items); setLoadError(false); })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);
  const filtered = antiques.filter((antique) =>
    antique.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="admin-page">
      <InventoryHeading administration={t("administration")} title={t("antiqueInventory")} />
      <div className="inventory-toolbar">
        <div className="inventory-search" role="search">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchInventory")}
            aria-label={t("searchInventory")}
          />
        </div>
        <Button as="button" className="btn btn-primary inventory-add-button" onClick={() => navigate("/admin/antiques/new")}>
          <Plus size={16} /> {t("addAntique")}
        </Button>
      </div>
      {!loading && !loadError && <p className="inventory-result-count">{filtered.length} / {antiques.length}</p>}
      {loading && (
        <div className="catalogue-state">
          <Spinner animation="border" size="sm" /> {t("loadingInventory")}
        </div>
      )}
      {loadError && <Alert variant="danger">{t("antiquesCouldNotLoad")}</Alert>}
      {!loading && !loadError && filtered.length === 0 && (
        <Alert variant="light">{t("noAntiquesFound")}</Alert>
      )}
      {!loading && !loadError && <InventoryList antiques={filtered} onSelect={(item) => navigate(`/antiques/${item.id}`)}
        uncategorized={t("uncategorized")} priceOnRequest={t("priceOnRequest")} locale={locale} />}
    </section>
  );
}

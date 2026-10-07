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
  useEffect(() => {
    getAllAntiques()
      .then(setAntiques)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  const filtered = antiques.filter((antique) =>
    antique.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="admin-page">
      <InventoryHeading administration={t("administration")} title={t("antiqueInventory")} />
      <div className="inventory-search">
        <Search size={17} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchInventory")}
          aria-label={t("searchInventory")}
        /> 
        <Button as="button" className="btn btn-outline-primary button-wide" onClick={() => navigate("/admin/antiques/new")}>
          <Plus size={16} /> {t("addAntique")}
        </Button>
      </div>
      {loading && (
        <div className="catalogue-state">
          <Spinner animation="border" size="sm" /> {t("loadingInventory")}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <Alert variant="light">{t("noAntiquesFound")}</Alert>
      )}
      <InventoryList antiques={filtered} onSelect={(item) => navigate(`/antiques/${item.id}`)}
        uncategorized={t("uncategorized")} priceOnRequest={t("priceOnRequest")} locale={locale} />
    </section>
  );
}

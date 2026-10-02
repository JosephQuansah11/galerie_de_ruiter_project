import { useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { Image, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllAntiques } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { suggestedAntiques } from "@/data/suggestedAntiques";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { formatEuroAmount } from "@/i18n";

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
      <div className="shopping-heading">
        <div>
          <span className="catalogue-artist">{t("administration")}</span>
          <h1>{t("antiqueInventory")}</h1>
        </div>
       
      </div>
      <div className="inventory-search">
        <Search size={17} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchInventory")}
          aria-label={t("searchInventory")}
        /> 
        <button className="btn btn-outline-primary button-wide" onClick={() => navigate("/admin/antiques/new")}>
          <Plus size={16} /> {t("addAntique")}
        </button>
      </div>
      {loading && (
        <div className="catalogue-state">
          <Spinner animation="border" size="sm" /> {t("loadingInventory")}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <Alert variant="light">{t("noAntiquesFound")}</Alert>
      )}
      <div className="inventory-list">
        {filtered.map((antique) => (
          <button
            className="inventory-row"
            key={antique.id}
            type="button"
            onClick={() => navigate(`/antiques/${antique.id}`)}
          >
            {antique.imageUrl ? (
              <img src={resolveAntiqueImageUrl(antique.imageUrl)} alt="" />
            ) : (
              <span className="inventory-placeholder">
                <Image size={20} />
              </span>
            )}
            <span>
              <strong>{antique.title}</strong>
              <small>
                {antique.category ?? t("uncategorized")} ·{" "}
                {antique.price == null
                  ? t("priceOnRequest")
                  : formatEuroAmount(antique.price, locale)}
              </small>
            </span>
          </button>
        ))}
      </div>
      <div className="reference-heading">
        <div>
          <span className="catalogue-artist">{t("referenceShortlist")}</span>
          <h2>{t("piecesToAddNext")}</h2>
        </div>
        <span>{t("imagesVisualReferences")}</span>
      </div>
      <div className="reference-grid">
        {suggestedAntiques.map((item) => (
          <article className="reference-card" key={item.title}>
            <img src={item.imageUrl} alt={item.title} loading="lazy" />
            <div className="reference-card-body">
              <strong>{item.title}</strong>
              <span>{item.category}</span>
              <p>{item.modellingNote}</p>
              <button
                // size="sm"
                // variant="outline-dark"
                style={{ width: "100%" }}
                className="btn btn-outline-secondary"
                onClick={() => navigate("/admin/antiques/new")}
              >
                {t("useAsReference")}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

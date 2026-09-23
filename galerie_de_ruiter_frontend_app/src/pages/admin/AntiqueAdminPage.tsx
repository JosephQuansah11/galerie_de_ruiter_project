import { useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { Image, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllAntiques } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { suggestedAntiques } from "@/data/suggestedAntiques";
import { useTranslation } from "react-i18next";

export default function AntiqueAdminPage() {
  const { t } = useTranslation();
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
          <span className="catalogue-artist">{t("ADMINISTRATION")}</span>
          <h1>{t("ANTIQUE_INVENTORY")}</h1>
        </div>
        <Button onClick={() => navigate("/admin/antiques/new")}>
          <Plus size={16} /> {t("ADD_ANTIQUE")}
        </Button>
      </div>
      <div className="inventory-search">
        <Search size={17} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("SEARCH_INVENTORY")}
          aria-label={t("SEARCH_INVENTORY")}
        />
      </div>
      {loading && (
        <div className="catalogue-state">
          <Spinner animation="border" size="sm" /> {t("LOADING_INVENTORY")}...
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <Alert variant="light">{t("NO_ANTIQUES_FOUND")}</Alert>
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
                {antique.category ?? t("UNCATEGORIZED")} ·{" "}
                {antique.price == null
                  ? t("PRICE_ON_REQUEST")
                  : `EUR ${antique.price.toFixed(2)}`}
              </small>
            </span>
          </button>
        ))}
      </div>
      <div className="reference-heading">
        <div>
          <span className="catalogue-artist">{t("REFERENCE_SHORTLIST")}</span>
          <h2>{t("PIECES_TO_ADD_NEXT")}</h2>
        </div>
        <span>{t("IMAGES_ARE_VISUAL_REFERENCES_FOR_SIX-VIEW_CAPTURE")}</span>
      </div>
      <div className="reference-grid">
        {suggestedAntiques.map((item) => (
          <article className="reference-card" key={item.title}>
            <img src={item.imageUrl} alt={item.title} loading="lazy" />
            <div className="reference-card-body">
              <strong>{item.title}</strong>
              <span>{item.category}</span>
              <p>{item.modellingNote}</p>
              <Button
                size="sm"
                variant="outline-dark"
                onClick={() => navigate("/admin/antiques/new")}
              >
                {t("USE_AS_REFERENCE")}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

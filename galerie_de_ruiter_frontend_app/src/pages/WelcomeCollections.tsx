import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getVisibleCategories } from "@/apis/backend_api";
import { useAntiqueContent } from "@/hooks/useAddAntiques";
import type Antique from "@/models/antiques/Antique";
import type { Category } from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";

function CategoryGrid({ categories }: { categories: Category[] }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="welcome-category-list" aria-label={t("collectionCategories")}>
      {categories.map((category) => (
        <Button as="button"
          className="welcome-category"
          key={category.id}
          type="button"
          onClick={() =>
            navigate(`/antiques?category=${encodeURIComponent(category.name)}`)
          }
        >
          <span>{category.name}</span>
          <small>
            {category.itemCount} {t("pieces")}
          </small>
        </Button>
      ))}
    </div>
  );
}

function FeaturedAntiques({ antiques }: { antiques: Antique[] }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="welcome-featured-grid">
      {antiques.map((antique) => {
        const imageUrl = resolveAntiqueImageUrl(
          antique.imageUrl ?? antique.imageUrls?.[0],
        );
        return (
          <Button as="button"
            className="welcome-featured-card"
            key={antique.id}
            type="button"
            onClick={() => navigate(`/antiques/${antique.id}`)}
          >
            <span className="welcome-featured-image">
              {imageUrl ? (
                <img src={imageUrl} alt="" />
              ) : (
                antique.title.slice(0, 1).toUpperCase()
              )}
            </span>
            <span className="welcome-featured-copy">
              <span className="catalogue-artist">
                {antique.category || t("galerieCollection")}
              </span>
              <strong>{antique.title}</strong>
            </span>
            <ArrowRight size={17} aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}

export default function WelcomeCollections() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { antiques, loading: antiquesLoading, error: antiquesError } =
    useAntiqueContent();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    let active = true;
    getVisibleCategories()
      .then((visibleCategories) => {
        if (active) setCategories(visibleCategories);
      })
      .catch(() => {
        if (active) setCategoriesError(true);
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const featuredAntiques = antiques.slice(0, 3);
  return (
    <section
      className="welcome-collections"
      aria-labelledby="welcome-collections-title"
    >
      <div className="welcome-collections-heading">
        <div>
          <span className="catalogue-artist">{t("collection")}</span>
          <h2 id="welcome-collections-title">{t("collectionTitle")}</h2>
          <p>{t("collectionIntro")}</p>
        </div>
        <Button as="button"
          className="btn btn-outline-dark"
          type="button"
          onClick={() => navigate("/antiques")}
        >
          {t("explore")} <ArrowRight size={16} />
        </Button>
      </div>
      {categoriesLoading && (
        <div className="catalogue-state">
          <Spinner animation="border" size="sm" /> {t("loadingCategories")}
        </div>
      )}
      {categoriesError && (
        <Alert variant="danger">{t("categoriesLoadError")}</Alert>
      )}
      {!categoriesLoading && categories.length > 0 && (
        <CategoryGrid categories={categories} />
      )}
      {antiquesLoading && (
        <div className="catalogue-state">
          <Spinner animation="border" size="sm" /> {t("loadingCollection")}
        </div>
      )}
      {antiquesError && (
        <Alert variant="danger">{t("collectionLoadError")}</Alert>
      )}
      {!antiquesLoading && !antiquesError && featuredAntiques.length > 0 && (
        <FeaturedAntiques antiques={featuredAntiques} />
      )}
      {!antiquesLoading && !antiquesError && featuredAntiques.length === 0 && (
        <div className="catalogue-state">{t("collectionWaiting")}</div>
      )}
    </section>
  );
}

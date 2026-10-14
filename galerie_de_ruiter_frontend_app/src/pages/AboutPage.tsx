import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Clock3, MapPin } from "lucide-react";
import { getAboutContent, getStoreLocation, type StoreLocation } from "@/apis/backend_api";
import { subscribeToContentUpdates } from "@/services/contentUpdates";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "@/hooks/usePageMeta";
import { renderAboutContent } from "./about/renderAboutContent";

export default function AboutPage() {
  const { t } = useTranslation();
  // The page is open to visitors and listed in the sitemap, so it names itself in the head.
  usePageMeta({ title: t("metaAboutTitle"), description: t("metaAboutDescription"), canonicalPath: "/about" });
  const [content, setContent] = useState<string>();
  const [location, setLocation] = useState<StoreLocation>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const loadContent = () => {
      getAboutContent()
        .then((result) => {
          if (active) {
            setContent(result.content);
            setError(false);
          }
        })
        .catch(() => {
          if (active) setError(true);
        });
    };
    // The gallery's address is owned by the store location — the same record the concierge
    // chat answers from — so the About page shows the live location instead of a copy that
    // can drift out of date.
    const loadLocation = () => {
      getStoreLocation()
        .then((value) => { if (active) setLocation(value); })
        .catch(() => { if (active) setLocation(undefined); });
    };
    loadContent();
    loadLocation();
    const unsubscribeAbout = subscribeToContentUpdates("about", loadContent);
    const unsubscribeLocation = subscribeToContentUpdates("location", loadLocation);
    return () => {
      active = false;
      unsubscribeAbout();
      unsubscribeLocation();
    };
  }, []);

  if (error) {
    return (
      <section className="about-page">
        <Alert variant="danger">{t("aboutLoadError")}</Alert>
      </section>
    );
  }
  if (content === undefined) {
    return (
      <div className="catalogue-state">
        <Spinner animation="border" size="sm" /> {t("aboutLoading")}
      </div>
    );
  }

  return (
    <article className="about-page">
      <div className="about-content">{renderAboutContent(content)}</div>
      {location && (
        <aside className="about-location" aria-label={t("location")}>
          <h2>{t("findPopup")}</h2>
          <div className="about-location-facts">
            <span>
              <MapPin size={18} aria-hidden="true" />
              <strong>{location.address}</strong>
            </span>
            <span>
              <Clock3 size={18} aria-hidden="true" />
              <strong>{location.openingHours}</strong>
            </span>
          </div>
          <Link to="/map">{t("openInMap")}</Link>
        </aside>
      )}
    </article>
  );
}

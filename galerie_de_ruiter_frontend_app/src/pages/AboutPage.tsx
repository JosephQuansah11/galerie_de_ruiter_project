import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { getAboutContent } from "@/apis/backend_api";
import { subscribeToContentUpdates } from "@/services/contentUpdates";
import { useTranslation } from "react-i18next";
import { renderAboutContent } from "./about/renderAboutContent";

export default function AboutPage() {
  const { t } = useTranslation();
  const [content, setContent] = useState<string>();
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
    loadContent();
    const unsubscribe = subscribeToContentUpdates("about", loadContent);
    return () => {
      active = false;
      unsubscribe();
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
    </article>
  );
}

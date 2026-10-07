import { useTranslation } from "react-i18next";
import { Alert, Card, Spinner } from "react-bootstrap";
import { AboutContentEditor } from "./about/AboutContentEditor";
import { useAboutAdmin } from "./about/useAboutAdmin";

export default function AboutAdminPage() {
  const { t } = useTranslation();
  const { content, setContent, loading, saving, message, error, submit } = useAboutAdmin();

  if (loading) {
    return (
      <div className="catalogue-state">
        <Spinner animation="border" size="sm" /> {t("aboutLoading")}
      </div>
    );
  }

  return (
    <section className="admin-form-page">
      <Card>
        <Card.Header>{t("editAboutPage")}</Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger">
              {t(message ?? "aboutSaveLoadError")}
            </Alert>
          )}
          {message && !error && <Alert variant="success">{t(message)}</Alert>}
          <AboutContentEditor content={content} saving={saving} onChange={setContent}
            onSubmit={submit} label={t("pageContentMarkdown")} savingText={t("saving")}
            saveText={t("saveAboutPage")} />
        </Card.Body>
      </Card>
    </section>
  );
}

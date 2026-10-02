import { useEffect, useState, type FormEvent } from "react";
import { Alert, Card, Spinner } from "react-bootstrap";
import { Save } from "lucide-react";
import { getAboutContent, updateAboutContent } from "@/apis/backend_api";
import { useTranslation } from "react-i18next";
import { publishContentUpdate } from "@/services/contentUpdates";

export default function AboutAdminPage() {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState(false);

  useEffect(() => {
    getAboutContent()
      .then((result) => setContent(result.content))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(undefined);
    try {
      const result = await updateAboutContent(content);
      setContent(result.content);
      publishContentUpdate("about");
      setMessage("aboutUpdated");
      setError(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

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
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">
                {t("pageContentMarkdown")}
              </label>
              <textarea
                className="form-control"
                rows={28}
                required
                maxLength={50000}
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </div>
            <button className="btn btn-primary" disabled={saving} type="submit">
              {saving ? <Spinner size="sm" /> : <Save size={16} />}
              {saving ? t("saving") : t("saveAboutPage")}
            </button>
          </form>
        </Card.Body>
      </Card>
    </section>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { Alert, Card, Spinner } from "react-bootstrap";
import { Save } from "lucide-react";
import { getAboutContent, updateAboutContent } from "@/apis/backend_api";

export default function AboutAdminPage() {
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
      setMessage("About page updated.");
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
        <Spinner animation="border" size="sm" /> Loading About page...
      </div>
    );
  }

  return (
    <section className="admin-form-page">
      <Card>
        <Card.Header>Edit About page</Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger">
              {message ?? "The About page could not be loaded or saved."}
            </Alert>
          )}
          {message && !error && <Alert variant="success">{message}</Alert>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">
                Page content (Markdown supported)
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
              {saving ? "Saving..." : "Save About page"}
            </button>
          </form>
        </Card.Body>
      </Card>
    </section>
  );
}

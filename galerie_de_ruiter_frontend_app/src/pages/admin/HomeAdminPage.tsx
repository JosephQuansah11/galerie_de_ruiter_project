import { useTranslation } from "react-i18next";
import { Alert, Card, Form, Spinner } from "react-bootstrap";
import { Save } from "lucide-react";
import { Button } from "@/components/ReactButton";
import { useHomeAdmin } from "./home/useHomeAdmin";
import { HomeImagesAdmin } from "./home/HomeImagesAdmin";

/**
 * Lets the gallery rewrite the dashboard / home page copy. Leaving a field empty keeps
 * the translated default for that language.
 */
export default function HomeAdminPage() {
  const { t } = useTranslation();
  const { content, update, loading, saving, message, error, submit } = useHomeAdmin();

  if (loading) {
    return <div className="catalogue-state"><Spinner animation="border" size="sm" /> {t("loadingCollection")}</div>;
  }

  return (
    <section className="admin-form-page">
      <Card>
        <Card.Header>{t("editHomePage")}</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{t(message ?? "formCouldNotSave")}</Alert>}
          {message && !error && <Alert variant="success">{t(message)}</Alert>}
          <p className="admin-intro">{t("homeContentHint")}</p>
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="home-hero-title">{t("homeHeroTitle")}</Form.Label>
              <Form.Control id="home-hero-title" value={content.heroTitle ?? ""} onChange={(event) => update("heroTitle", event.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="home-hero-intro">{t("homeHeroIntro")}</Form.Label>
              <Form.Control id="home-hero-intro" as="textarea" rows={3} value={content.heroIntro ?? ""}
                onChange={(event) => update("heroIntro", event.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="home-philosophy">{t("homePhilosophyText")}</Form.Label>
              <Form.Control id="home-philosophy" as="textarea" rows={3} value={content.philosophyText ?? ""}
                onChange={(event) => update("philosophyText", event.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="home-visit">{t("homeVisitText")}</Form.Label>
              <Form.Control id="home-visit" as="textarea" rows={3} value={content.visitText ?? ""}
                onChange={(event) => update("visitText", event.target.value)} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label htmlFor="home-story">{t("homeStoryParagraphs")}</Form.Label>
              <Form.Control id="home-story" as="textarea" rows={8} value={content.storyParagraphs ?? ""}
                onChange={(event) => update("storyParagraphs", event.target.value)} />
              <Form.Text>{t("homeStoryParagraphsHint")}</Form.Text>
            </Form.Group>
            <Button className="btn btn-primary" type="submit" disabled={saving}>
              <Save size={16} />{t(saving ? "saving" : "saveHomePage")}
            </Button>
          </Form>
          <HomeImagesAdmin />
        </Card.Body>
      </Card>
    </section>
  );
}

import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { getAboutContent } from "@/apis/backend_api";
import { subscribeToContentUpdates } from "@/services/contentUpdates";
import { useTranslation } from "react-i18next";

function inlineFormatting(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderAboutContent(content: string) {
  return content.split(/\r?\n/).map((line, index) => {
    if (!line.trim()) return null;
    if (/^---+$/.test(line.trim())) {
      return <hr key={index} />;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const text = inlineFormatting(heading[2]);
      if (heading[1].length === 1) return <h1 key={index}>{text}</h1>;
      if (heading[1].length === 2) return <h2 key={index}>{text}</h2>;
      return <h3 key={index}>{text}</h3>;
    }
    return <p key={index}>{inlineFormatting(line)}</p>;
  });
}

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

import { useTranslation } from "react-i18next";
import { useHomeContent } from "@/hooks/useHomeContent";

export function WelcomeStory() {
  const { t } = useTranslation();
  const home = useHomeContent();
  // The gallery can write its own story: one paragraph per line. Otherwise the
  // translated paragraphs are used.
  const written = (home?.storyParagraphs ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const paragraphs = written.length > 0
    ? written
    : Array.from({ length: 6 }, (_, index) => t(`welcomeStoryParagraph${index + 1}`));
  return <section className="welcome-story" aria-labelledby="welcome-story-title">
    <span className="catalogue-artist">{t("welcomeStoryEyebrow")}</span>
    <h2 id="welcome-story-title">{t("welcomeStoryTitle")}</h2>
    <div className="welcome-story-copy">{paragraphs.map((text, index) => <p key={index}>{text}</p>)}</div>
  </section>;
}

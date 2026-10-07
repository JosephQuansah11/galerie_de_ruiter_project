import { useTranslation } from "react-i18next";

export function WelcomeStory() {
  const { t } = useTranslation();
  const paragraphs = Array.from({ length: 6 }, (_, index) => t(`welcomeStoryParagraph${index + 1}`));
  return <section className="welcome-story" aria-labelledby="welcome-story-title">
    <span className="catalogue-artist">{t("welcomeStoryEyebrow")}</span>
    <h2 id="welcome-story-title">{t("welcomeStoryTitle")}</h2>
    <div className="welcome-story-copy">{paragraphs.map((text, index) => <p key={index}>{text}</p>)}</div>
  </section>;
}

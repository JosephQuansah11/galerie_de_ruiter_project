import { useTranslation } from "react-i18next";
import { usePageMeta } from "@/hooks/usePageMeta";
import { WelcomeHero } from "./welcome/WelcomeHero";
import { WelcomeHighlights } from "./welcome/WelcomeHighlights";
import { WelcomeSlider } from "./welcome/WelcomeSlider";
import { WelcomeStory } from "./welcome/WelcomeStory";
import { useHomeImages } from "@/hooks/useHomeImages";

export default function WelcomePage() {
  const { t } = useTranslation();
  const images = useHomeImages();
  usePageMeta({ title: t("metaHomeTitle"), description: t("metaHomeDescription"), canonicalPath: "/dashboard" });
  return <section className="welcome-page">
    <WelcomeHero />
    <WelcomeSlider images={images} />
    <WelcomeHighlights />
    <WelcomeStory />
  </section>;
}

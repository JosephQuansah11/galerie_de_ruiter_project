import { useTranslation } from "react-i18next";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useLocationCity } from "@/hooks/useLocationCity";
import { titleWithCity } from "@/services/pageTitle";
import { WelcomeHero } from "./welcome/WelcomeHero";
import { WelcomeHighlights } from "./welcome/WelcomeHighlights";
import { WelcomeSlider } from "./welcome/WelcomeSlider";
import { WelcomeStory } from "./welcome/WelcomeStory";
import { useHomeImages } from "@/hooks/useHomeImages";

export default function WelcomePage() {
  const { t } = useTranslation();
  const images = useHomeImages();
  // The title carries the gallery's categories and the city of the pop-up, both of which a
  // visitor searches for ("antiek Waasmunster"); the city comes from the location record.
  const city = useLocationCity();
  usePageMeta({
    title: titleWithCity(t, "metaHomeTitle", city),
    description: t("metaHomeDescription"),
    canonicalPath: "/home",
  });
  return <section className="welcome-page">
    <WelcomeHero />
    <WelcomeSlider images={images} />
    {/* The gallery asked for the story where the philosophy and pop-up cards used to sit, so the
        story follows the photographs and the two cards close the page. */}
    <WelcomeStory />
    <WelcomeHighlights />
  </section>;
}

import { WelcomeHero } from "./welcome/WelcomeHero";
import { WelcomeHighlights } from "./welcome/WelcomeHighlights";
import { WelcomeSlider } from "./welcome/WelcomeSlider";
import { WelcomeStory } from "./welcome/WelcomeStory";
import { useHomeImages } from "@/hooks/useHomeImages";

export default function WelcomePage() {
  const images = useHomeImages();
  return <section className="welcome-page">
    <WelcomeHero />
    <WelcomeSlider images={images} />
    <WelcomeHighlights />
    <WelcomeStory />
  </section>;
}

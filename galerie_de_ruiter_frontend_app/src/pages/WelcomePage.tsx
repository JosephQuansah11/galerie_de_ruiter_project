import { WelcomeHero } from "./welcome/WelcomeHero";
import { WelcomeHighlights } from "./welcome/WelcomeHighlights";
import { WelcomeStory } from "./welcome/WelcomeStory";

export default function WelcomePage() {
  return <section className="welcome-page">
    <WelcomeHero />
    <WelcomeHighlights />
    <WelcomeStory />
  </section>;
}

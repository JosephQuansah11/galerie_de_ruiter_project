import { ArrowRight, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useHomeContent } from "@/hooks/useHomeContent";

export function WelcomeHero() {
  const { t } = useTranslation();
  const home = useHomeContent();
  return <div className="welcome-hero">
    {/* The gallery logo lives with the welcome message, large, next to the copy. */}
    <figure className="welcome-hero-logo">
      <img src="/images/galerie_de_ruiter.png" alt="Galerie de Ruiter" className="welcome-logo" />
    </figure>
    <div className="welcome-hero-copy">
      <span className="catalogue-artist">{t("galleryName")}</span>
      <h1>{home?.heroTitle?.trim() || t("welcomeTitle")}</h1>
      <p>{home?.heroIntro?.trim() || t("welcomeIntro")}</p>
      <div className="welcome-actions">
        <NavLink className="btn btn-dark" to="/antiques">{t("explore")} <ArrowRight size={17} /></NavLink>
        <NavLink className="btn btn-outline-dark" to="/dashboard/chat"><MessageCircle size={17} /> {t("talkToGallery")}</NavLink>
      </div>
    </div>
  </div>;
}

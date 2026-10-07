import { ArrowRight, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

export function WelcomeHero() {
  const { t } = useTranslation();
  return <div className="welcome-hero">
    <span className="catalogue-artist">{t("galleryName")}</span>
    <h1>{t("welcomeTitle")}</h1>
    <p>{t("welcomeIntro")}</p>
    <div className="welcome-actions">
      <NavLink className="btn btn-dark" to="/antiques">{t("explore")} <ArrowRight size={17} /></NavLink>
      <NavLink className="btn btn-outline-dark" to="/dashboard/chat"><MessageCircle size={17} /> {t("talkToGallery")}</NavLink>
    </div>
  </div>;
}

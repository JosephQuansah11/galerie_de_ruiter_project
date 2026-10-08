import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

export function WelcomeHighlights() {
  const { t } = useTranslation();
  return <div className="welcome-grid">
    <article><Sparkles size={24} /><span className="catalogue-artist">{t("ourPhilosophy")}</span><h2>{t("curiosityOverClutter")}</h2><p>{t("philosophyText")}</p></article>
    <article><MapPin size={24} /><span className="catalogue-artist">{t("popupShop")}</span><h2>{t("meetCollection")}</h2><p>{t("visitLocationText")}</p><NavLink className="btn btn-link" to="/map">{t("seeLocation")} <ArrowRight size={15} /></NavLink></article>
  </div>;
}

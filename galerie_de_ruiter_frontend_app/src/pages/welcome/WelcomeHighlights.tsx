import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useHomeContent } from "@/hooks/useHomeContent";

export function WelcomeHighlights() {
  const { t } = useTranslation();
  const home = useHomeContent();
  return <div className="welcome-grid">
    <article><Sparkles size={24} /><span className="catalogue-artist">{t("ourPhilosophy")}</span><h2>{t("curiosityOverClutter")}</h2><p>{home?.philosophyText?.trim() || t("philosophyText")}</p></article>
    <article><MapPin size={24} /><span className="catalogue-artist">{t("popupShop")}</span><h2>{t("meetCollection")}</h2><p>{home?.visitText?.trim() || t("visitLocationText")}</p><NavLink className="btn btn-link" to="/map">{t("seeLocation")} <ArrowRight size={15} /></NavLink></article>
  </div>;
}

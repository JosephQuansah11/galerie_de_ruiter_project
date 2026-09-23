import { ArrowRight, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const shareUrl = window.location.origin;
  return (
    <section className="welcome-page">
      <div className="welcome-hero">
        <span className="catalogue-artist">{t("GALERIE DE RUITER")}</span>
        <h1>{t("welcomeTitle")}</h1>
        <p>{t("welcomeIntro")}</p>
        <div className="welcome-actions">
          <button className="btn btn-dark" type="button" onClick={() => navigate("/antiques")}>
            {t("explore")} <ArrowRight size={17} />
          </button>
          <button
            className="btn btn-outline-dark"
            type="button"
            onClick={() => navigate("/dashboard/chat")}
          >
            <MessageCircle size={17} /> {t("Talk to the gallery")}
          </button>
        </div>
      </div>
      <div className="welcome-grid">
        <article>
          <Sparkles size={24} />
          <span className="catalogue-artist">{t("OUR PHILOSOPHY")}</span>
          <h2>{t("Curiosity over clutter.")}</h2>
          <p>
            {t(
              "Every piece is selected for its material quality, character and the conversation it starts.",
            )}
          </p>
        </article>
        <article>
          <MapPin size={24} />
          <span className="catalogue-artist">{t("POP-UP SHOP")}</span>
          <h2>{t("Meet the collection in person.")}</h2>
          <p>
            {t(
              "Visit the current location, ask questions and find the right piece",
            )}
            {t("for your home.")}
          </p>
          <button className="btn btn-link" type="button" onClick={() => navigate("/map")}>
            {t("See location")} <ArrowRight size={15} />
          </button>
        </article>
        <article className="share-card">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
            alt="QR code linking to Galerie de Ruiter"
          />
          <div>
            <span className="catalogue-artist">{t("SHARE THE GALERIE")}</span>
            <h2>{t("Take the collection with you.")}</h2>
            <p>{t("Scan this code to open the gallery online.")}</p>
          </div>
        </article>
      </div>
    </section>
  );
}

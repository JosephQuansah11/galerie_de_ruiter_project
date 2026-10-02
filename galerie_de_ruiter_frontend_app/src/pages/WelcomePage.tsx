import { ArrowRight, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
// import { useLanguage } from "@/context/LanguageContext";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // const { language } = useLanguage();
  const shareUrl = window.location.origin;
  return (
    <section className="welcome-page">
      <div className="welcome-hero">
        <span className="catalogue-artist">{t("galleryName")}</span>
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
            <MessageCircle size={17} /> {t("talkToGallery")}
          </button>
        </div>
      </div>
      <div className="welcome-grid">
        <article>
          <Sparkles size={24} />
          <span className="catalogue-artist">{t("ourPhilosophy")}</span>
          <h2>{t("curiosityOverClutter")}</h2>
          <p>{t("philosophyText")}</p>
        </article>
        <article>
          <MapPin size={24} />
          <span className="catalogue-artist">{t("popupShop")}</span>
          <h2>{t("meetCollection")}</h2>
          <p>{t("visitLocationText")}</p>
          <button className="btn btn-link" type="button" onClick={() => navigate("/map")}>
            {t("seeLocation")} <ArrowRight size={15} />
          </button>
        </article>
        <article className="share-card">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
            alt={t("galleryQrCodeAlt")}
          />
          <div>
            <span className="catalogue-artist">{t("shareTheGalerie")}</span>
            <h2>{t("takeCollectionWithYou")}</h2>
            <p>{t("scanCodeText")}</p>
          </div>
        </article>
      </div>
      <section className="welcome-story" aria-labelledby="welcome-story-title">
        <span className="catalogue-artist">{t("welcomeStoryEyebrow")}</span>
        <h2 id="welcome-story-title">{t("welcomeStoryTitle")}</h2>
        <div className="welcome-story-copy">
          <p>{t("welcomeStoryParagraph1")}</p>
          <p>{t("welcomeStoryParagraph2")}</p>
          <p>{t("welcomeStoryParagraph3")}</p>
          <p>{t("welcomeStoryParagraph4")}</p>
          <p>{t("welcomeStoryParagraph5")}</p>
          <p>{t("welcomeStoryParagraph6")}</p>
        </div>
      </section>
    </section>
  );
}

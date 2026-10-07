import { ArrowRight, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import WelcomeCollections from "@/pages/WelcomeCollections";

function WelcomeHero() {
  const { t } = useTranslation();
  return (
    <div className="welcome-hero">
      <span className="catalogue-artist">{t("galleryName")}</span>
      <h1>{t("welcomeTitle")}</h1>
      <p>{t("welcomeIntro")}</p>
      <div className="welcome-actions">
        <NavLink className="btn btn-dark" to="/antiques">
          {t("explore")} <ArrowRight size={17} />
        </NavLink>
        <NavLink className="btn btn-outline-dark" to="/dashboard/chat">
          <MessageCircle size={17} /> {t("talkToGallery")}
        </NavLink>
      </div>
    </div>
  );
}

function WelcomeHighlights({ shareUrl }: { shareUrl: string }) {
  const { t } = useTranslation();
  return (
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
        <NavLink className="btn btn-link" to="/map">
          {t("seeLocation")} <ArrowRight size={15} />
        </NavLink>
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
  );
}

function WelcomeStory() {
  const { t } = useTranslation();
  return (
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
  );
}

export default function WelcomePage() {
  const shareUrl = window.location.origin;
  return (
    <section className="welcome-page">
      <WelcomeHero />
      <WelcomeCollections />
      <WelcomeHighlights shareUrl={shareUrl} />
      <WelcomeStory />
    </section>
  );
}

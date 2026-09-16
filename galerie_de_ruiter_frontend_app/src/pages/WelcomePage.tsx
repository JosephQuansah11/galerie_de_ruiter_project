import { ArrowRight, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const shareUrl = window.location.origin;
  return (
    <section className="welcome-page">
      <div className="welcome-hero">
        <span className="catalogue-artist">GALERIE DE RUITER</span>
        <h1>{t("welcomeTitle")}</h1>
        <p>{t("welcomeIntro")}</p>
        <div className="welcome-actions"><Button variant="dark" onClick={() => navigate("/antiques")}>{t("explore")} <ArrowRight size={17} /></Button><Button variant="outline-dark" onClick={() => navigate("/dashboard/chat")}><MessageCircle size={17} /> Talk to the gallery</Button></div>
      </div>
      <div className="welcome-grid">
        <article><Sparkles size={24} /><span className="catalogue-artist">OUR PHILOSOPHY</span><h2>Curiosity over clutter.</h2><p>Every piece is selected for its material quality, character and the conversation it starts.</p></article>
        <article><MapPin size={24} /><span className="catalogue-artist">POP-UP SHOP</span><h2>Meet the collection in person.</h2><p>Visit the current location, ask questions and find the right piece for your home.</p><Button variant="link" onClick={() => navigate("/map")}>See location <ArrowRight size={15} /></Button></article>
        <article className="share-card"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`} alt="QR code linking to Galerie de Ruiter" /><div><span className="catalogue-artist">SHARE THE GALERIE</span><h2>Take the collection with you.</h2><p>Scan this code to open the gallery online.</p></div></article>
      </div>
    </section>
  );
}
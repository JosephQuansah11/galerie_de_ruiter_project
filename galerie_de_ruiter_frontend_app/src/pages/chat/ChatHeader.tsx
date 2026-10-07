import { ExternalLink, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ChatAppointment } from "./useGalleryChat";

export function ChatHeader({ appointment }: { appointment?: ChatAppointment }) {
  const { t } = useTranslation();
  const appointmentDetails = appointment
    ? `I'd like to confirm the appointment time proposed in chat: ${new Date(appointment.at).toLocaleString()} (${appointment.type}).`
    : "";
  const whatsappMessage = appointmentDetails
    ? `Hello Galerie de Ruiter, ${appointmentDetails}`
    : "Hello Galerie de Ruiter";
  return <header className="chat-header">
    <div className="chat-icon"><MessageCircle size={24} /></div>
    <div><span className="catalogue-artist">{t("galerieConcierge")}</span><h1>{t("talkToGallery")}</h1><p>{t("chatIntro")}</p></div>
    <a className="chat-whatsapp" href={`https://wa.me/32493357568?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noreferrer">
      <ExternalLink size={15} /> {t("messageOnWhatsApp")}
    </a>
  </header>;
}

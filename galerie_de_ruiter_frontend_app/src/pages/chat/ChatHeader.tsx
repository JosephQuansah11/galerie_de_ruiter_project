import { ExternalLink, LogIn, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ChatAppointment } from "./useGalleryChat";

const WHATSAPP_NUMBER = "32493357568";

export function ChatHeader({ appointment }: { appointment?: ChatAppointment }) {
  const { t, i18n } = useTranslation();
  const { authenticated, profile } = useAuth();
  // The gallery wants the visitor's real name on the hand-off, never the account's username.
  const requester = [profile?.firstName, profile?.lastName]
    .filter((part) => part && part.trim())
    .join(" ")
    .trim();
  const selectedDate = appointment ? new Date(`${appointment.at}:00Z`) : undefined;
  const appointmentDetails = appointment
    ? t("chatAppointmentWhatsappDetails", {
        type: appointment.type === "VISIT" ? t("appointmentVisit") : t("appointmentOnline"),
        date: new Intl.DateTimeFormat(i18n.language, { dateStyle: "long", timeZone: "UTC" }).format(selectedDate),
        time: new Intl.DateTimeFormat(i18n.language, { timeStyle: "short", timeZone: "UTC" }).format(selectedDate),
      })
    : "";
  // The signed-in visitor's name travels with the request so the gallery knows who is asking.
  const nameSuffix = requester ? ` My name is ${requester}.` : "";
  const whatsappMessage = appointmentDetails
    ? `Hello Galerie de Ruiter, ${appointmentDetails}${nameSuffix}`
    : "Hello Galerie de Ruiter";
  return <header className="chat-header">
    <div className="chat-icon"><MessageCircle size={24} /></div>
    <div><span className="catalogue-artist">{t("galerieConcierge")}</span><h1>{t("talkToGallery")}</h1><p>{t("chatIntro")}</p></div>
    {/* Talking to the gallery on WhatsApp needs an account, so a visitor is offered sign-in
        instead of a link that would take them straight out of the app. */}
    {authenticated
      ? <a className="chat-whatsapp" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noreferrer">
          <ExternalLink size={15} /> {t("messageOnWhatsApp")}
        </a>
      : <Link className="chat-whatsapp" to="/login" state={{ from: "/chat" }}>
          <LogIn size={15} /> {t("chatWhatsappSignIn")}
        </Link>}
  </header>;
}

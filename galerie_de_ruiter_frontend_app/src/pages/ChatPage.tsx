import { useTranslation } from "react-i18next";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useGalleryChat } from "./chat/useGalleryChat";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatThread } from "./chat/ChatThread";
import { ChatComposer } from "./chat/ChatComposer";
import { ChatQuickOptions } from "./chat/ChatQuickOptions";
import { ChatAppointmentPicker } from "./chat/ChatAppointmentPicker";
import { useState } from "react";

/**
 * The gallery chat. There is no model behind it any more: the assistant answers from the gallery's own
 * records, so there is no connection to establish, no status to report and nothing to wait for - the
 * composer is ready with the page. What the page offers is what it always offered: the collection, the
 * location and the opening hours, and a request for a visit or an online appointment.
 */
export default function ChatPage() {
  const { t, i18n } = useTranslation();
  // The reply comes back in the visitor's language, so the assistant is told which one it is.
  const chat = useGalleryChat(i18n.language);
  const [showAppointmentPicker, setShowAppointmentPicker] = useState(false);
  // The chat is one URL now: it used to answer on `/dashboard/chat` too, and that address
  // redirects here, so the canonical points at the page a visitor actually reads.
  usePageMeta({ title: t("metaChatTitle"), description: t("metaChatDescription"), canonicalPath: "/chat" });
  return <section className="chat-page">
    <ChatHeader appointment={chat.appointment} />
    <ChatThread messages={chat.messages} sending={chat.sending} />
    <ChatQuickOptions disabled={chat.sending} onPrompt={(prompt) => void chat.sendText(prompt)}
      onAppointment={() => setShowAppointmentPicker((visible) => !visible)} />
    {showAppointmentPicker && <ChatAppointmentPicker disabled={chat.sending}
      onCancel={() => setShowAppointmentPicker(false)}
      onSubmit={(message, selection) => {
        setShowAppointmentPicker(false);
        void chat.sendText(message, selection);
      }} />}
    {chat.appointment && <div className="appointment-summary">
      <strong>{t("chatAppointmentRequestReady")}</strong>
      <span>{new Intl.DateTimeFormat(i18n.language, { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(`${chat.appointment.at}:00Z`))}
        {" · "}{chat.appointment.type === "VISIT" ? t("appointmentVisit") : t("appointmentOnline")}</span>
      <span>{t("chatAppointmentNote")}</span>
    </div>}
    <ChatComposer draft={chat.draft} sending={chat.sending} disabled={chat.sending} onChange={chat.setDraft} onSubmit={chat.send} />
  </section>;
}

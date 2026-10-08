import { useTranslation } from "react-i18next";
import { useGalleryChat } from "./chat/useGalleryChat";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatThread } from "./chat/ChatThread";
import { ChatComposer } from "./chat/ChatComposer";
import { ChatQuickOptions } from "./chat/ChatQuickOptions";
import { ChatAppointmentPicker } from "./chat/ChatAppointmentPicker";
import { useState } from "react";

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const chat = useGalleryChat();
  const [showAppointmentPicker, setShowAppointmentPicker] = useState(false);
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
    <ChatComposer draft={chat.draft} sending={chat.sending} onChange={chat.setDraft} onSubmit={chat.send} />
  </section>;
}

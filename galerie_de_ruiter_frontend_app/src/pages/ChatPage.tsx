import { useTranslation } from "react-i18next";
import { Spinner } from "react-bootstrap";
import { RefreshCw } from "lucide-react";
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
    {!chat.ready && <div className="chat-status" role="status" aria-live="polite">
      <Spinner animation="border" size="sm" />
      <div className="chat-status-copy">
        <strong>{t(chat.checkingConnection ? "chatConnecting" : "chatNotReady")}</strong>
        {chat.connectionDetail && <span>{chat.connectionDetail}</span>}
      </div>
      {!chat.checkingConnection && <button type="button" className="chat-status-retry"
        onClick={() => void chat.checkConnection()}>
        <RefreshCw size={15} />{t("chatRetry")}
      </button>}
    </div>}
    <ChatThread messages={chat.messages} sending={chat.sending} />
    <ChatQuickOptions disabled={!chat.ready || chat.sending} onPrompt={(prompt) => void chat.sendText(prompt)}
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
    <ChatComposer draft={chat.draft} sending={chat.sending} disabled={!chat.ready} onChange={chat.setDraft} onSubmit={chat.send} />
  </section>;
}

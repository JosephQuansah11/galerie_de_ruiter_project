import { useTranslation } from "react-i18next";
import { useGalleryChat } from "./chat/useGalleryChat";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatThread } from "./chat/ChatThread";
import { ChatComposer } from "./chat/ChatComposer";

export default function ChatPage() {
  const { t } = useTranslation();
  const chat = useGalleryChat();
  return <section className="chat-page">
    <ChatHeader appointment={chat.appointment} />
    <ChatThread messages={chat.messages} sending={chat.sending} />
    {chat.appointment && <div className="appointment-summary"><strong>{t("appointmentNoted")}</strong><span>{new Date(chat.appointment.at).toLocaleString()} ({chat.appointment.type})</span></div>}
    <ChatComposer draft={chat.draft} sending={chat.sending} onChange={chat.setDraft} onSubmit={chat.send} />
  </section>;
}

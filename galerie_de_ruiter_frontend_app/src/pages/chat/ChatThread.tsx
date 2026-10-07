import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { ChatMessage } from "./useGalleryChat";

export function ChatThread({ messages, sending }: { messages: ChatMessage[]; sending: boolean }) {
  const { t } = useTranslation();
  return <div className="chat-thread">
    {messages.map((message, index) => <div className={`chat-bubble chat-${message.role}`} key={`${message.role}-${index}`}>
      {message.translationKey ? t(message.translationKey) : message.text}
    </div>)}
    {sending && <div className="chat-bubble chat-assistant"><Spinner size="sm" animation="border" /> {t("thinking")}</div>}
  </div>;
}

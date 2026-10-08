import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ChatMessage } from "./useGalleryChat";

export function ChatThread({ messages, sending }: { messages: ChatMessage[]; sending: boolean }) {
  const { t } = useTranslation();
  return <div className="chat-thread">
    {messages.map((message, index) => <div className={`chat-bubble chat-${message.role}`} key={`${message.role}-${index}`}>
      {message.translationKey ? t(message.translationKey) : message.text}
      {message.sources && message.sources.length > 0 && <nav className="chat-sources" aria-label={t("chatSources")}>
        <strong>{t("chatSources")}:</strong>
        {message.sources.map((source) => <Link key={`${source.url}-${source.title}`} to={source.url}>{source.title}</Link>)}
      </nav>}
    </div>)}
    {sending && <div className="chat-bubble chat-assistant"><Spinner size="sm" animation="border" /> {t("thinking")}</div>}
  </div>;
}

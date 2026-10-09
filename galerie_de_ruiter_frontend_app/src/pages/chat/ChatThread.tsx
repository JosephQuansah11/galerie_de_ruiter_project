import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ExternalLink, MessageCircle } from "lucide-react";
import type { ChatMessage } from "./useGalleryChat";

const isExternal = (url: string) => /^https?:\/\//i.test(url);
const isWhatsApp = (url: string) => /^https?:\/\/(?:www\.)?(?:wa\.me|api\.whatsapp\.com)/i.test(url);

export function ChatThread({ messages, sending }: { messages: ChatMessage[]; sending: boolean }) {
  const { t } = useTranslation();
  return <div className="chat-thread">
    {messages.map((message, index) => <div className={`chat-bubble chat-${message.role}`} key={`${message.role}-${index}`}>
      {message.translationKey ? t(message.translationKey) : message.text}
      {message.sources && message.sources.length > 0 && <nav className="chat-sources" aria-label={t("chatSources")}>
        <strong>{t("chatSources")}:</strong>
        {message.sources.map((source) => isExternal(source.url)
          ? <a key={`${source.url}-${source.title}`} className={isWhatsApp(source.url) ? "chat-source-whatsapp" : undefined}
            href={source.url} target="_blank" rel="noreferrer">
            {isWhatsApp(source.url)
              ? <><MessageCircle size={15} aria-hidden="true" /> {t("whatsappContact")}</>
              : <><ExternalLink size={14} aria-hidden="true" /> {source.title}</>}
          </a>
          : <Link key={`${source.url}-${source.title}`} to={source.url}>{source.title}</Link>)}
      </nav>}
    </div>)}
    {sending && <div className="chat-bubble chat-assistant"><Spinner size="sm" animation="border" /> {t("thinking")}</div>}
  </div>;
}

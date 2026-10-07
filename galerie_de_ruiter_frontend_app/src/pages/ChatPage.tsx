import { useState } from "react";
import { Form, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { MessageCircle, Send, ExternalLink } from "lucide-react";
import { sendChatMessage } from "@/apis/chat_api";
import { useTranslation } from "react-i18next";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  translationKey?: string;
};

export default function ChatPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "",
      translationKey: "chatWelcome",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [appointment, setAppointment] = useState<string>();
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    setDraft("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setSending(true);
    try {
      const response = await sendChatMessage(message);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: response.message },
      ]);
      if (response.appointmentAt)
        setAppointment(
          `${response.appointmentAt} (${response.appointmentType})`,
        );
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "",
          translationKey: "chatUnavailable",
        },
      ]);
    } finally {
      setSending(false);
    }
  };
  return (
    <section className="chat-page">
      <header className="chat-header">
        <div className="chat-icon">
          <MessageCircle size={24} />
        </div>
        <div>
          <span className="catalogue-artist">{t("galerieConcierge")}</span>
          <h1>{t("talkToGallery")}</h1>
          <p>{t("chatIntro")}</p>
        </div>
        <a
          className="chat-whatsapp"
          href="https://wa.me/32493357568?text=Hello%20Galerie%20de%20Ruiter"
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={15} /> {t("messageOnWhatsApp")}
        </a>
      </header>
      <div className="chat-thread">
        {messages.map((message, index) => (
          <div
            className={`chat-bubble chat-${message.role}`}
            key={`${message.role}-${index}`}
          >
            {message.translationKey ? t(message.translationKey) : message.text}
          </div>
        ))}
        {sending && (
          <div className="chat-bubble chat-assistant">
            <Spinner size="sm" animation="border" /> {t("thinking")}
          </div>
        )}
      </div>
      {appointment && (
        <div className="appointment-summary">
          <strong>{t("appointmentNoted")}</strong>
          <span>{appointment}</span>
        </div>
      )}
      <form className="chat-composer" onSubmit={send}>
        <Form.Control
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("writeMessage")}
          aria-label={t("chatMessage")}
        />
        <Button
          className="btn btn-dark"
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label={t("sendMessage")}
        >
          <Send size={17} />
        </Button>
      </form>
    </section>
  );
}

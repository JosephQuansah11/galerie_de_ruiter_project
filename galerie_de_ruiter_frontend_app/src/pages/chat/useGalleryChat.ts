import { useEffect, useState, type FormEvent } from "react";
import { sendChatMessage, type ChatAppointmentSelection, type ChatHistoryMessage } from "@/apis/chat_api";
import {
  readChatSession,
  writeChatSession,
  type ChatSessionAppointment,
  type ChatSessionMessage,
} from "@/services/chatSession";

export type ChatMessage = ChatSessionMessage;
export type ChatAppointment = ChatSessionAppointment;

/** The greeting every new conversation opens with. */
const WELCOME_MESSAGE: ChatMessage = { role: "assistant", text: "", translationKey: "chatWelcome" };

/**
 * The gallery chat.
 *
 * The assistant answers from the gallery's own records rather than from a language model, so there is
 * no connection to establish, no model to warm up and no status worth reporting: the composer is ready
 * as soon as the page is, and the only thing that ever disables it is a request already in flight.
 * What is left is the conversation itself, which lasts for the visit - a restored session keeps its
 * thread, and signing out clears it (see services/chatSession).
 */
export function useGalleryChat(language?: string) {
  const [restored] = useState(readChatSession);
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => (restored && restored.messages.length > 0 ? restored.messages : [WELCOME_MESSAGE]),
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [appointment, setAppointment] = useState<ChatAppointment | undefined>(restored?.appointment);

  // Persist the thread on every change so navigation and a refresh keep it.
  useEffect(() => {
    writeChatSession({ messages, appointment });
  }, [messages, appointment]);

  const sendText = async (text: string, appointmentSelection?: ChatAppointmentSelection) => {
    const message = text.trim();
    if (!message || sending) return;
    setDraft("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    if (appointmentSelection) setAppointment(appointmentSelection);
    setSending(true);
    try {
      const history: ChatHistoryMessage[] = messages
        .filter((item) => !item.translationKey && item.text.trim())
        .map(({ role, text }) => ({ role, text }))
        .slice(-30);
      const response = await sendChatMessage(message, history, appointmentSelection, language);
      setMessages((current) => [...current, appointmentSelection
        ? { role: "assistant", text: "", translationKey: "chatAppointmentSubmitted", sources: response.sources }
        : { role: "assistant", text: response.message, sources: response.sources }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "", translationKey: "chatUnavailable" }]);
    } finally {
      setSending(false);
    }
  };
  const send = (event: FormEvent) => {
    event.preventDefault();
    void sendText(draft);
  };
  return { messages, draft, setDraft, sending, appointment, send, sendText };
}

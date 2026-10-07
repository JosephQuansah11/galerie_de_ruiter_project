import { useState, type FormEvent } from "react";
import { sendChatMessage, type ChatHistoryMessage } from "@/apis/chat_api";

export type ChatMessage = { role: "user" | "assistant"; text: string; translationKey?: string };
export type ChatAppointment = { at: string; type: string };

export function useGalleryChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: "", translationKey: "chatWelcome" }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [appointment, setAppointment] = useState<ChatAppointment>();
  const send = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    setDraft("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setSending(true);
    try {
      const history: ChatHistoryMessage[] = messages
        .filter((item) => !item.translationKey && item.text.trim())
        .map(({ role, text }) => ({ role, text }))
        .slice(-30);
      const response = await sendChatMessage(message, history);
      setMessages((current) => [...current, { role: "assistant", text: response.message }]);
      if (response.appointmentConfirmed && response.appointmentAt && response.appointmentType) {
        setAppointment({ at: response.appointmentAt, type: response.appointmentType });
      }
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "", translationKey: "chatUnavailable" }]);
    } finally {
      setSending(false);
    }
  };
  return { messages, draft, setDraft, sending, appointment, send };
}

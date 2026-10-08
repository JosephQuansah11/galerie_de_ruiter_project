import { useState, type FormEvent } from "react";
import { sendChatMessage, type ChatAppointmentSelection, type ChatHistoryMessage, type ChatSource } from "@/apis/chat_api";

export type ChatMessage = { role: "user" | "assistant"; text: string; translationKey?: string; sources?: ChatSource[] };
export type ChatAppointment = ChatAppointmentSelection;

export function useGalleryChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: "", translationKey: "chatWelcome" }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [appointment, setAppointment] = useState<ChatAppointment>();
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
      const response = await sendChatMessage(message, history, appointmentSelection);
      setMessages((current) => [...current, appointmentSelection
        ? { role: "assistant", text: "", translationKey: "chatAppointmentSubmitted" }
        : response.appointmentHandoffRequired
          ? { role: "assistant", text: "", translationKey: "chatAppointmentConfirmationRequired" }
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

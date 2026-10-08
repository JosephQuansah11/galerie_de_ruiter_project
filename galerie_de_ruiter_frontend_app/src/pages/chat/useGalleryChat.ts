import { useCallback, useEffect, useState, type FormEvent } from "react";
import { fetchChatStatus, sendChatMessage, type ChatAppointmentSelection, type ChatHistoryMessage, type ChatSource } from "@/apis/chat_api";

export type ChatMessage = { role: "user" | "assistant"; text: string; translationKey?: string; sources?: ChatSource[] };
export type ChatAppointment = ChatAppointmentSelection;

const CONNECTION_RETRY_MS = 10000;

export function useGalleryChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: "", translationKey: "chatWelcome" }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [appointment, setAppointment] = useState<ChatAppointment>();
  const [ready, setReady] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [connectionDetail, setConnectionDetail] = useState<string>();

  const checkConnection = useCallback(async () => {
    setCheckingConnection(true);
    try {
      const status = await fetchChatStatus();
      setReady(status.ready);
      setConnectionDetail(status.ready ? undefined : status.detail);
      return status.ready;
    } catch {
      setReady(false);
      setConnectionDetail(undefined);
      return false;
    } finally {
      setCheckingConnection(false);
    }
  }, []);

  // The chat model connection is confirmed before the composer accepts a prompt.
  useEffect(() => { void checkConnection(); }, [checkConnection]);

  useEffect(() => {
    if (ready) return;
    const timer = window.setInterval(() => { void checkConnection(); }, CONNECTION_RETRY_MS);
    return () => window.clearInterval(timer);
  }, [checkConnection, ready]);

  const sendText = async (text: string, appointmentSelection?: ChatAppointmentSelection) => {
    const message = text.trim();
    if (!message || sending) return;
    // Appointment requests are recorded by the API without the language model, so they
    // stay available while the model is still warming up.
    if (!ready && !appointmentSelection) {
      setMessages((current) => [...current, { role: "assistant", text: "", translationKey: "chatNotReady" }]);
      return;
    }
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
      // A failed request can mean the model dropped out, so re-check the connection.
      void checkConnection();
      setMessages((current) => [...current, { role: "assistant", text: "", translationKey: "chatUnavailable" }]);
    } finally {
      setSending(false);
    }
  };
  const send = (event: FormEvent) => {
    event.preventDefault();
    void sendText(draft);
  };
  return { messages, draft, setDraft, sending, appointment, send, sendText, ready, checkingConnection, connectionDetail, checkConnection };
}

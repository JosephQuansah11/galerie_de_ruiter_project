import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { fetchChatStatus, sendChatMessage, warmUpChat, type ChatAppointmentSelection, type ChatHistoryMessage, type ChatSource } from "@/apis/chat_api";

export type ChatMessage = { role: "user" | "assistant"; text: string; translationKey?: string; sources?: ChatSource[] };
export type ChatAppointment = ChatAppointmentSelection;

const CONNECTION_RETRY_MS = 10000;
const SESSION_HEARTBEAT_MS = 60000;

export function useGalleryChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: "", translationKey: "chatWelcome" }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [appointment, setAppointment] = useState<ChatAppointment>();
  const [ready, setReady] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [connectionDetail, setConnectionDetail] = useState<string>();
  // The connection is established when the visitor enters the page and then kept for
  // the whole session: a transient probe failure no longer drops the chat back to
  // "connecting" while the visitor stays on the page.
  const connectedForSession = useRef(false);

  const checkConnection = useCallback(async () => {
    setCheckingConnection(true);
    try {
      const status = await warmUpChat();
      if (status.ready) {
        connectedForSession.current = true;
        setReady(true);
        setConnectionDetail(undefined);
        return true;
      }
      setReady(false);
      setConnectionDetail(status.detail);
      return false;
    } catch {
      setReady(false);
      setConnectionDetail(undefined);
      return false;
    } finally {
      setCheckingConnection(false);
    }
  }, []);

  /** Session heartbeat: keeps the page's connection state without downgrading it. */
  const refreshConnection = useCallback(async () => {
    try {
      const status = await fetchChatStatus();
      if (status.ready) {
        connectedForSession.current = true;
        setReady(true);
        setConnectionDetail(undefined);
      } else if (!connectedForSession.current) {
        setReady(false);
        setConnectionDetail(status.detail);
      }
    } catch {
      // Keep the established session connection when a single probe fails.
    }
  }, []);

  useEffect(() => { void checkConnection(); }, [checkConnection]);

  useEffect(() => {
    if (ready) return;
    const timer = window.setInterval(() => { void checkConnection(); }, CONNECTION_RETRY_MS);
    return () => window.clearInterval(timer);
  }, [checkConnection, ready]);

  // While the visitor stays on the chat page the model connection is kept warm.
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => { void refreshConnection(); }, SESSION_HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [ready, refreshConnection]);

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
      // A failed request can mean the model dropped out, so re-check in the background.
      void refreshConnection();
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

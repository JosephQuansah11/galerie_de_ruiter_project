import { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { MessageCircle, Send, ExternalLink } from "lucide-react";
import { sendChatMessage } from "@/apis/chat_api";

type ChatMessage = { role: "user" | "assistant"; text: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: "Welcome to Galerie de Ruiter. I can help arrange a visit or online consultation." }]);
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
      setMessages((current) => [...current, { role: "assistant", text: response.message }]);
      if (response.appointmentAt) setAppointment(`${response.appointmentAt} (${response.appointmentType})`);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "The assistant is unavailable. Please try WhatsApp or try again later." }]);
    } finally { setSending(false); }
  };
  return <section className="chat-page"><header className="chat-header"><div className="chat-icon"><MessageCircle size={24} /></div><div><span className="catalogue-artist">GALERIE CONCIERGE</span><h1>Talk to the gallery</h1><p>Ask about a piece, arrange a visit, or continue directly with the owner.</p></div><a className="chat-whatsapp" href="https://wa.me/32496487139?text=Hello%20Galerie%20de%20Ruiter" target="_blank" rel="noreferrer"><ExternalLink size={15} /> Message on WhatsApp</a></header><div className="chat-thread">{messages.map((message, index) => <div className={`chat-bubble chat-${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}{sending && <div className="chat-bubble chat-assistant"><Spinner size="sm" animation="border" /> Thinking...</div>}</div>{appointment && <div className="appointment-summary"><strong>Appointment noted</strong><span>{appointment}</span></div>}<Form className="chat-composer" onSubmit={send}><Form.Control value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." aria-label="Chat message" /><Button type="submit" disabled={sending || !draft.trim()}><Send size={17} /></Button></Form></section>;
}
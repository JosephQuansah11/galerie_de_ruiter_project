import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FormEvent } from "react";

export function ChatComposer({ draft, sending, disabled, onChange, onSubmit }: {
  draft: string;
  sending: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const { t } = useTranslation();
  return <form className="chat-composer" onSubmit={onSubmit}
    toolname="askGallery"
    tooldescription="Asks the gallery's own concierge a question and shows its answer in the chat. It knows what the gallery shows, where the pop-up is and when it is open, and can take an appointment request.">
    <Form.Control id="chat-message" value={draft} onChange={(event) => onChange(event.target.value)} placeholder={t(disabled ? "chatConnectingShort" : "writeMessage")} aria-label={t("chatMessage")} maxLength={2000} disabled={disabled} toolparamdescription="The question, in the visitor's own words." />
    <Button className="btn btn-dark" type="submit" disabled={Boolean(disabled) || sending || !draft.trim()} aria-label={t("sendMessage")} text={<Send size={17} />} />
  </form>;
}

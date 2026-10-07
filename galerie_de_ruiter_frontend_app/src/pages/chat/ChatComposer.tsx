import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FormEvent } from "react";

export function ChatComposer({ draft, sending, onChange, onSubmit }: {
  draft: string;
  sending: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const { t } = useTranslation();
  return <form className="chat-composer" onSubmit={onSubmit}>
    <Form.Control value={draft} onChange={(event) => onChange(event.target.value)} placeholder={t("writeMessage")} aria-label={t("chatMessage")} maxLength={2000} />
    <Button className="btn btn-dark" type="submit" disabled={sending || !draft.trim()} aria-label={t("sendMessage")} text={<Send size={17} />} />
  </form>;
}

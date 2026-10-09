import { BookOpen, CalendarDays, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ChatQuickOptions({
  disabled,
  onPrompt,
  onAppointment,
}: {
  disabled: boolean;
  onPrompt: (prompt: string) => void;
  onAppointment: () => void;
}) {
  const { t } = useTranslation();
  return <div className="chat-quick-options" aria-label={t("chatSuggestedQuestions")}>
    <button type="button" className="chat-option" disabled={disabled}
      onClick={() => onPrompt(t("chatPromptCollection"))}>
      <BookOpen size={16} /> {t("chatOptionCollection")}
    </button>
    <button type="button" className="chat-option" disabled={disabled}
      onClick={() => onPrompt(t("chatPromptLocation"))}>
      <MapPin size={16} /> {t("chatOptionLocation")}
    </button>
    <button type="button" className="chat-option" disabled={disabled} onClick={onAppointment}>
      <CalendarDays size={16} /> {t("chatOptionAppointment")}
    </button>
  </div>;
}

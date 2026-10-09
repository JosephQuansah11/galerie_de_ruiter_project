import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ChatAppointmentSelection } from "@/apis/chat_api";

function galleryLocalDateTime() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function ChatAppointmentPicker({
  disabled,
  onCancel,
  onSubmit,
}: {
  disabled: boolean;
  onCancel: () => void;
  onSubmit: (message: string, selection: ChatAppointmentSelection) => void;
}) {
  const { t } = useTranslation();
  const now = galleryLocalDateTime();
  const today = now.slice(0, 10);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [type, setType] = useState<ChatAppointmentSelection["type"]>("VISIT");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const at = `${date}T${time}`;
    if (at <= galleryLocalDateTime()) {
      setError(t("chatAppointmentFuture"));
      return;
    }
    const selection = { at, type };
    const selectedDate = new Date(`${at}:00Z`);
    onSubmit(t("chatAppointmentUserMessage", {
      date: new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeZone: "UTC" }).format(selectedDate),
      time,
      type: type === "VISIT" ? t("appointmentVisit") : t("appointmentOnline"),
    }), selection);
  };

  const minimumTime = date === today ? now.slice(11, 16) : undefined;

  return <form className="chat-appointment-picker" onSubmit={submit}>
    <strong>{t("chatAppointmentHeading")}</strong>
    <div className="chat-appointment-fields">
      <label>{t("chatAppointmentDate")}
        <input type="date" value={date} min={today} required disabled={disabled}
          onChange={(event) => { setDate(event.target.value); setError(""); }} />
      </label>
      <label>{t("chatAppointmentTime")}
        <input type="time" value={time} min={minimumTime} required disabled={disabled}
          onChange={(event) => { setTime(event.target.value); setError(""); }} />
      </label>
      <label>{t("chatAppointmentType")}
        <select value={type} disabled={disabled} onChange={(event) => setType(event.target.value as ChatAppointmentSelection["type"])}>
          <option value="VISIT">{t("appointmentVisit")}</option>
          <option value="ONLINE">{t("appointmentOnline")}</option>
        </select>
      </label>
    </div>
    {error && <p className="chat-appointment-error" role="alert">{error}</p>}
    <p className="chat-appointment-note">{t("chatAppointmentNote")}</p>
    <div className="chat-appointment-actions">
      <button className="chat-option" type="button" disabled={disabled} onClick={onCancel}>{t("cancel")}</button>
      <button className="chat-option chat-option-primary" type="submit" disabled={disabled}>{t("chatAppointmentRequest")}</button>
    </div>
  </form>;
}

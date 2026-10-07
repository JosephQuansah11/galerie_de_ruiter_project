import { useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import type { FormField, Antique } from "../types/types";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ReactButton";

export function Avatar({
  name,
  firstName,
  lastName,
  size = "medium",
}: {
  name?: string;
  firstName?: string;
  lastName?: string;
  size?: "small" | "medium" | "large";
}) {
  const { t } = useTranslation();
  const namedInitials = [firstName, lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.trim()[0]);
  const displayName =
    [firstName, lastName].filter((part) => part?.trim()).join(" ") ||
    name ||
    t("guest");
  const initials = (
    namedInitials.length
      ? namedInitials
      : displayName.split(/\s+/).map((part) => part[0])
  )
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={`avatar avatar-${size}`} aria-label={t("profileNamed", { name: displayName })}>
      {initials}
    </span>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  return (
    <label className="search-field">
      <Search size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? t("searchPlaceholder")}
        aria-label={t("search")}
      />
      <kbd>/</kbd>
    </label>
  );
}

export function DropdownPanel({
  label,
  children
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dropdown">
      <Button as="button" className="quiet-button" onClick={() => setOpen(!open)}>
        {label}
        <ChevronDown size={16} />
      </Button>
      {open && <div className="dropdown-panel">{children}</div>}
    </div>
  );
}

export function DynamicForm<T extends object>({
  fields,
  initialValue,
  submitLabel,
  onSubmit,
}: {
  fields: FormField<T>[];
  initialValue: T;
  submitLabel: string;
  onSubmit: (value: T) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState<T>(initialValue);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(value);
  };
  return (
    <form className="dynamic-form" onSubmit={submit}>
      {fields.map((field) => (
        <label key={field.name}>
          {field.label}
          {field.type === "textarea" ? (
            <textarea
              required={field.required}
              placeholder={field.placeholder}
              value={String(value[field.name] ?? "")}
              onChange={(event) =>
                setValue({ ...value, [field.name]: event.target.value })
              }
            />
          ) : field.type === "select" ? (
            <select
              value={String(value[field.name] ?? "")}
              onChange={(event) =>
                setValue({ ...value, [field.name]: event.target.value })
              }
            >
              <option value="">{t("selectOne")}</option>
              {field.options?.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              required={field.required}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              value={String(value[field.name] ?? "")}
              onChange={(event) =>
                setValue({
                  ...value,
                  [field.name]:
                    field.type === "number"
                      ? Number(event.target.value)
                      : event.target.value,
                })
              }
            />
          )}
        </label>
      ))}
      <Button as="button" className="primary-button" type="submit">
        <Sparkles size={16} />
        {submitLabel}
      </Button>
    </form>
  );
}

export function AntiqueCard({
  antique,
  onSelect,
}: {
  antique: Antique;
  onSelect?: (antique: Antique) => void;
}) {
  const { t } = useTranslation();
  return (
    <article className="antique-card" onClick={() => onSelect?.(antique)}>
      <div className="poster">
        <span>{antique.title.slice(0, 1)}</span>
        <small>{antique.description ?? t("now")}</small>
      </div>
      <div className="antique-card-body">
        {/* <div className="eyebrow">
          {antique.description ?? "Feature"} · {antique.description ?? "EN"}
        </div> */}
        <h3>{antique.title}</h3>
        <p>{antique.description || t("storyWaiting")}</p>
        <div className="antique-meta">
          <span>★ {antique.rating ?? "—"}</span>
        </div>
      </div>
    </article>
  );
}

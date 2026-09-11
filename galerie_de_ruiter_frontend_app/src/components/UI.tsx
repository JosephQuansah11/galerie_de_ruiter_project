import { useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import type { FormField, Antique } from "../types/types";

export function Avatar({
  name = "Guest",
  size = "medium",
}: {
  name?: string;
  size?: "small" | "medium" | "large";
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={`avatar avatar-${size}`} aria-label={`${name} profile`}>
      {initials}
    </span>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search antiques, directors, genres...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-field">
      <Search size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search"
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
      <button className="quiet-button" onClick={() => setOpen(!open)}>
        {label}
        <ChevronDown size={16} />
      </button>
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
              <option value="">Select one</option>
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
      <button className="primary-button" type="submit">
        <Sparkles size={16} />
        {submitLabel}
      </button>
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
  return (
    <article className="antique-card" onClick={() => onSelect?.(antique)}>
      <div className="poster">
        <span>{antique.title.slice(0, 1)}</span>
        <small>{antique.description ?? "NOW"}</small>
      </div>
      <div className="antique-card-body">
        {/* <div className="eyebrow">
          {antique.description ?? "Feature"} · {antique.description ?? "EN"}
        </div> */}
        <h3>{antique.title}</h3>
        <p>{antique.description || "A story waiting to be discovered."}</p>
        <div className="antique-meta">
          <span>★ {antique.rating ?? "—"}</span>
        </div>
      </div>
    </article>
  );
}

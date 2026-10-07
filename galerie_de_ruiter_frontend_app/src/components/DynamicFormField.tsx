import type { FormField } from "@/types/types";
import { useTranslation } from "react-i18next";

export function DynamicFormField<T extends object>({
  field,
  value,
  onChange,
}: {
  field: FormField<T>;
  value: unknown;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const currentValue = String(value ?? "");
  if (field.type === "textarea") {
    return <textarea required={field.required} placeholder={field.placeholder} value={currentValue} onChange={(event) => onChange(event.target.value)} />;
  }
  if (field.type === "select") {
    return <select value={currentValue} onChange={(event) => onChange(event.target.value)}>
      <option value="">{t("selectOne")}</option>
      {field.options?.map((option) => <option key={option}>{option}</option>)}
    </select>;
  }
  return <input
    required={field.required}
    type={field.type ?? "text"}
    placeholder={field.placeholder}
    value={currentValue}
    onChange={(event) => onChange(event.target.value)}
  />;
}

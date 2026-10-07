import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ReactButton";
import type { FormField } from "@/types/types";
import { DynamicFormField } from "./DynamicFormField";

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
  const updateField = (name: keyof T & string, next: string, type?: string) => {
    const updated = type === "number" ? Number(next) : next;
    setValue((current) => ({ ...current, [name]: updated }));
  };
  return (
    <form className="dynamic-form" onSubmit={submit}>
      {fields.map((field) => (
        <label key={field.name}>
          {field.label}
          <DynamicFormField
            field={field}
            value={value[field.name]}
            onChange={(next) => updateField(field.name, next, field.type)}
          />
        </label>
      ))}
      <Button
        className="primary-button"
        type="submit"
        text={<><Sparkles size={16} />{submitLabel}</>}
      />
    </form>
  );
}

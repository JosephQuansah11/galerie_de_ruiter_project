import { useState, type FormEvent } from "react";
import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import type { AntiqueForm } from "@/models/antiques/Antique";
import { AddAntiqueItem } from "@/hooks/useAddAntiques";
import type { FormBaseEntity } from "@/types/types";
import { useTranslation } from "react-i18next";
import { buildFormObject } from "./buildFormObject";
import { AddFormFields } from "./AddFormFields";

export function AddForm<T extends FormBaseEntity>({ items, onSubmit, buttonName }: {
  items: T; onSubmit?: (data: T) => void | Promise<void>; buttonName?: string;
}) {
  const { t } = useTranslation();
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) { event.stopPropagation(); setValidated(true); return; }
    setValidated(true);
    setError(undefined);
    try {
      const value = buildFormObject(new FormData(form), items);
      if (onSubmit) await onSubmit(value);
      else if ("name" in value && "email" in value) await AddAntiqueItem(value as unknown as AntiqueForm);
      else setError("formCouldNotSubmit");
    } catch {
      setError("formCouldNotSave");
    }
  };
  return <Form noValidate validated={validated} method="post" onSubmit={submit} className="ms-2">
    {error && <div className="alert alert-danger" role="alert">{t(error)}</div>}
    <AddFormFields value={items} />
    <Button type="submit" style={{ width: "100%" }} className="btn btn-primary mt-3" text={buttonName ?? t("submit")} />
  </Form>;
}

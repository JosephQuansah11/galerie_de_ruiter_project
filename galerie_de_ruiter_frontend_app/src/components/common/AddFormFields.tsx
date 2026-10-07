import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export function AddFormFields({ value, prefix = "" }: { value: Record<string, unknown>; prefix?: string }) {
  const { t } = useTranslation();
  return <>{Object.entries(value).map(([key, fieldValue]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    if (fieldValue && typeof fieldValue === "object" && !Array.isArray(fieldValue)) {
      return <div key={name}><h6 className="mt-3 mb-2 text-capitalize">{t(key, { defaultValue: key })}</h6><AddFormFields value={fieldValue as Record<string, unknown>} prefix={name} /></div>;
    }
    const label = t(key, { defaultValue: key.replace(/([A-Z])/g, " $1").trim() });
    return <Form.Group controlId={`formBasic${name}`} key={name} className="mb-3">
      <Form.Label className="text-capitalize">{label}</Form.Label>
      <Form.Control required type="text" name={name} defaultValue={String(fieldValue ?? "")} placeholder={t("enterField", { field: label })} />
    </Form.Group>;
  })}</>;
}

import { Form, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Clock3, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { useLocationAdmin } from "./useLocationAdmin";
import { LocationCoordinates } from "./LocationCoordinates";

type Props = Pick<ReturnType<typeof useLocationAdmin>, "form" | "update" | "saving" | "lookupMessage" | "lookupAddress" | "submit">;
export function LocationEditor({ form, update, saving, lookupMessage, lookupAddress, submit }: Props) {
  const { t } = useTranslation();
  return <Form onSubmit={submit}>
    <Form.Group className="mb-3"><Form.Label>{t("address")}</Form.Label>
      <div className="address-lookup"><Form.Control required value={form.address} onChange={(event) => update("address", event.target.value)} />
        <Button className="btn btn-outline-secondary" type="button" onClick={lookupAddress}>{t("findCoordinates")}</Button>
      </div>{lookupMessage && <Form.Text>{t(lookupMessage)}</Form.Text>}
    </Form.Group>
    <Form.Group className="mb-3"><Form.Label><Clock3 size={15} /> {t("openingHours")}</Form.Label>
      <Form.Control required value={form.openingHours} onChange={(event) => update("openingHours", event.target.value)}
        placeholder={t("openingHoursPlaceholder")} /></Form.Group>
    <LocationCoordinates form={form} update={update} />
    <Button className="btn btn-primary" disabled={saving} type="submit">
      {saving ? <Spinner size="sm" /> : <Save size={16} />}{saving ? t("saving") : t("saveLocation")}
    </Button>
  </Form>;
}

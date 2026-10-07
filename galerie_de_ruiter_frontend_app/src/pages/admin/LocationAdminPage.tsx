import { Alert, Card, Spinner } from "react-bootstrap";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LocationEditor } from "./location/LocationEditor";
import { useLocationAdmin } from "./location/useLocationAdmin";

export default function LocationAdminPage() {
  const { t } = useTranslation();
  const admin = useLocationAdmin();
  if (admin.loading) return <div className="catalogue-state"><Spinner animation="border" size="sm" /> {t("loadingLocation")}</div>;
  return <section className="admin-form-page"><Card>
    <Card.Header><MapPin size={20} /> {t("editStoreLocation")}</Card.Header>
    <Card.Body>
      {admin.message && <Alert variant={admin.message.includes("CouldNot") ? "danger" : "success"}>{t(admin.message)}</Alert>}
      <LocationEditor {...admin} />
    </Card.Body>
  </Card></section>;
}

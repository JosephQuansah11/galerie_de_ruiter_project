import { useEffect, useState, type FormEvent } from "react";
import { Alert, Card, Form, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Clock3, MapPin, Save } from "lucide-react";
import {
  getStoreLocation,
  updateStoreLocation,
  type StoreLocation,
} from "@/apis/backend_api";
import { publishContentUpdate } from "@/services/contentUpdates";

import { useTranslation } from "react-i18next";

export default function LocationAdminPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<Omit<StoreLocation, "id">>({
    address: "",
    openingHours: "",
    latitude: 51.2194,
    longitude: 4.4025,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [lookupMessage, setLookupMessage] = useState<string>();

  useEffect(() => {
    getStoreLocation()
      .then(({ id: _id, ...location }) => setForm(location))
      .catch(() => setMessage("locationCouldNotLoad"))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]:
        field === "latitude" || field === "longitude" ? Number(value) : value,
    }));
  };

  const lookupAddress = async () => {
    if (!form.address.trim()) return;
    setLookupMessage("findingCoordinates");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(form.address)}`,
        { headers: { Accept: "application/json" } },
      );
      const results = (await response.json()) as Array<{
        lat: string;
        lon: string;
      }>;
      if (!results[0]) {
        setLookupMessage("noMatchingAddress");
        return;
      }
      setForm((current) => ({
        ...current,
        latitude: Number(results[0].lat),
        longitude: Number(results[0].lon),
      }));
      setLookupMessage("coordinatesFound");
    } catch {
      setLookupMessage("addressLookupFailed");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateStoreLocation(form);
      publishContentUpdate("location");
      setMessage("locationUpdated");
    } catch {
      setMessage("locationCouldNotUpdate");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="catalogue-state">
        <Spinner animation="border" size="sm" /> {t("loadingLocation")}
      </div>
    );
  }

  return (
    <section className="admin-form-page">
      <Card>
        <Card.Header>
          <MapPin size={20} /> {t("editStoreLocation")}
        </Card.Header>
        <Card.Body>
          {message && (
            <Alert
              variant={message.includes("CouldNot") ? "danger" : "success"}
            >
              {t(message)}
            </Alert>
          )}
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>{t("address")}</Form.Label>
              <div className="address-lookup">
                <Form.Control
                  required
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                />
                <Button as="button"
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={lookupAddress}
                >
                  {t("findCoordinates")}
                </Button>
              </div>
              {lookupMessage && <Form.Text>{t(lookupMessage)}</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <Clock3 size={15} /> {t("openingHours")}
              </Form.Label>
              <Form.Control
                required
                value={form.openingHours}
                onChange={(event) =>
                  update("openingHours", event.target.value)
                }
                placeholder={t("openingHoursPlaceholder")}
              />
            </Form.Group>
            <div className="admin-coordinate-grid">
              <Form.Group>
                <Form.Label>{t("latitude")}</Form.Label>
                <Form.Control
                  required
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(event) => update("latitude", event.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>{t("longitude")}</Form.Label>
                <Form.Control
                  required
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(event) => update("longitude", event.target.value)}
                />
              </Form.Group>
            </div>
            <Button as="button"
              className="btn btn-primary"
              disabled={saving}
              type="submit"
            >
              {saving ? <Spinner size="sm" /> : <Save size={16} />}
              {saving ? t("saving") : t("saveLocation")}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </section>
  );
}

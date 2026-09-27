import { useEffect, useState, type FormEvent } from "react";
import { Alert, Card, Form, Spinner } from "react-bootstrap";
import { Clock3, MapPin, Save } from "lucide-react";
import {
  getStoreLocation,
  updateStoreLocation,
  type StoreLocation,
} from "@/apis/backend_api";

export default function LocationAdminPage() {
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
      .catch(() => setMessage("Location could not be loaded."))
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
    setLookupMessage("Finding coordinates...");
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
        setLookupMessage("No matching address found.");
        return;
      }
      setForm((current) => ({
        ...current,
        latitude: Number(results[0].lat),
        longitude: Number(results[0].lon),
      }));
      setLookupMessage("Coordinates found.");
    } catch {
      setLookupMessage("Address lookup failed. Enter coordinates manually.");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateStoreLocation(form);
      setMessage("Location updated.");
    } catch {
      setMessage("Location could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="catalogue-state">
        <Spinner animation="border" size="sm" /> Loading location...
      </div>
    );
  }

  return (
    <section className="admin-form-page">
      <Card>
        <Card.Header>
          <MapPin size={20} /> Edit store location
        </Card.Header>
        <Card.Body>
          {message && (
            <Alert
              variant={message.includes("could not") ? "danger" : "success"}
            >
              {message}
            </Alert>
          )}
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <div className="address-lookup">
                <Form.Control
                  required
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={lookupAddress}
                >
                  Find coordinates
                </button>
              </div>
              {lookupMessage && <Form.Text>{lookupMessage}</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <Clock3 size={15} /> Opening hours
              </Form.Label>
              <Form.Control
                required
                value={form.openingHours}
                onChange={(event) =>
                  update("openingHours", event.target.value)
                }
                placeholder="Thursday to Sunday, 11:00 to 18:00"
              />
            </Form.Group>
            <div className="admin-coordinate-grid">
              <Form.Group>
                <Form.Label>Latitude</Form.Label>
                <Form.Control
                  required
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(event) => update("latitude", event.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Longitude</Form.Label>
                <Form.Control
                  required
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(event) => update("longitude", event.target.value)}
                />
              </Form.Group>
            </div>
            <button
              className="btn btn-primary"
              disabled={saving}
              type="submit"
            >
              {saving ? <Spinner size="sm" /> : <Save size={16} />}
              {saving ? "Saving..." : "Save location"}
            </button>
          </Form>
        </Card.Body>
      </Card>
    </section>
  );
}

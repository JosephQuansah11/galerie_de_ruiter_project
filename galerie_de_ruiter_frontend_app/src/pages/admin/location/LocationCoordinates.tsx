import { Form } from "react-bootstrap";
import type { StoreLocation } from "@/apis/backend_api";

type Props = { form: Omit<StoreLocation, "id">; update: (field: keyof Omit<StoreLocation, "id">, value: string) => void };
export function LocationCoordinates({ form, update }: Props) {
  return <div className="admin-coordinate-grid">
    <Form.Group><Form.Label>Latitude</Form.Label><Form.Control required type="number" step="any"
      value={form.latitude} onChange={(event) => update("latitude", event.target.value)} /></Form.Group>
    <Form.Group><Form.Label>Longitude</Form.Label><Form.Control required type="number" step="any"
      value={form.longitude} onChange={(event) => update("longitude", event.target.value)} /></Form.Group>
  </div>;
}

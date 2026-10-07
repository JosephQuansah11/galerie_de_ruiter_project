import { useEffect, useState, type FormEvent } from "react";
import { getStoreLocation, updateStoreLocation, type StoreLocation } from "@/apis/backend_api";
import { publishContentUpdate } from "@/services/contentUpdates";

type LocationForm = Omit<StoreLocation, "id">;
export function useLocationAdmin() {
  const [form, setForm] = useState<LocationForm>({ address: "", openingHours: "", latitude: 51.2194, longitude: 4.4025 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [lookupMessage, setLookupMessage] = useState<string>();
  useEffect(() => {
    getStoreLocation().then(({ id: _id, ...location }) => setForm(location))
      .catch(() => setMessage("locationCouldNotLoad")).finally(() => setLoading(false));
  }, []);
  const update = (field: keyof LocationForm, value: string) => setForm((current) => ({
    ...current, [field]: field === "latitude" || field === "longitude" ? Number(value) : value,
  }));
  const lookupAddress = async () => {
    if (!form.address.trim()) return;
    setLookupMessage("findingCoordinates");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(form.address)}`, { headers: { Accept: "application/json" } });
      const results = await response.json() as Array<{ lat: string; lon: string }>;
      if (!results[0]) return setLookupMessage("noMatchingAddress");
      setForm((current) => ({ ...current, latitude: Number(results[0].lat), longitude: Number(results[0].lon) }));
      setLookupMessage("coordinatesFound");
    } catch { setLookupMessage("addressLookupFailed"); }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    try { await updateStoreLocation(form); publishContentUpdate("location"); setMessage("locationUpdated"); }
    catch { setMessage("locationCouldNotUpdate"); } finally { setSaving(false); }
  };
  return { form, update, loading, saving, message, lookupMessage, lookupAddress, submit };
}

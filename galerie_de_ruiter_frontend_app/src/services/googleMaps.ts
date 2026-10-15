/**
 * Google Maps, in place of the OpenStreetMap embed and the Nominatim lookup the gallery used
 * before.
 *
 * The key is a browser key: it ships in the bundle and is protected by the HTTP-referrer
 * restriction on the Google Cloud side, not by secrecy. Reading it here gives the deployment one
 * place to set it (`VITE_GOOGLE_MAPS_API_KEY`, see .env, the Dockerfile and render.yaml) and one
 * place to decide what the gallery does without it: the address, the opening hours and a link to
 * Google Maps, which needs no key at all.
 */
type Place = { address?: string; latitude: number; longitude: number };

/** Read on every call rather than once at import, so a build without a key caches no answer. */
export function googleMapsKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "").trim();
}


/** The gallery's own address searches best: Google resolves it to the place, pin and all. */
function query({ address, latitude, longitude }: Place): string {
  const trimmed = address?.trim();
  return trimmed ? trimmed : `${latitude},${longitude}`;
}

/**
 * The Embed API frame. A frame rather than the Maps JavaScript API on purpose: the landing page
 * just spent its critical path on a first paint, and a map that arrives as a frame costs the page
 * no JavaScript of its own.
 */
export function googleMapsEmbedUrl(place: Place): string | undefined {
  const key = googleMapsKey();
  if (!key) return undefined;
  const params = new URLSearchParams({ key, q: query(place), zoom: "16" });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

/** The Maps URL scheme. It needs no key, so the link is always there to follow. */
export function googleMapsLink(place: Place): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query(place))}`;
}

export type GeocodeOutcome =
  | { status: "found"; latitude: number; longitude: number }
  | { status: "none" }
  | { status: "unavailable" }
  | { status: "failed" };

/**
 * Turns the address an administrator typed into coordinates, through Google's geocoder. The
 * outcome is spelled out because the screen has something different to say about each: an address
 * Google does not know is a typo, a refused request is a key that needs attention, and a request
 * that never completed is a connection problem.
 */
export async function geocodeAddress(address: string): Promise<GeocodeOutcome> {
  const key = googleMapsKey();
  if (!key) return { status: "unavailable" };
  try {
    const params = new URLSearchParams({ address, key });
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
      { headers: { Accept: "application/json" } });
    const payload = await response.json() as {
      status?: string;
      results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
    };
    if (payload.status === "ZERO_RESULTS") return { status: "none" };
    const location = payload.results?.[0]?.geometry?.location;
    if (payload.status !== "OK" || typeof location?.lat !== "number" || typeof location?.lng !== "number") {
      return { status: "unavailable" };
    }
    return { status: "found", latitude: location.lat, longitude: location.lng };
  } catch {
    return { status: "failed" };
  }
}

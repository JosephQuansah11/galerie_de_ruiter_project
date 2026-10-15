import { geocodeAddress, googleMapsEmbedUrl, googleMapsLink } from "./googleMaps";

/**
 * The gallery maps through Google instead of OpenStreetMap. These pin the two things that are easy
 * to get subtly wrong: the address is what both the frame and the link search for (bare coordinates
 * land on an empty patch of street, not on the gallery), and a build without a key has to keep
 * working rather than show a broken frame.
 */
const place = { address: "De Ruiter 12, Waasmunster", latitude: 51.0994, longitude: 4.1025 };

describe("googleMapsEmbedUrl", () => {
  it("searches for the address the gallery shows", () => {
    const url = new URL(googleMapsEmbedUrl(place)!);
    expect(`${url.origin}${url.pathname}`).toBe("https://www.google.com/maps/embed/v1/place");
    expect(url.searchParams.get("q")).toBe(place.address);
    expect(url.searchParams.get("key")).toBe("test-maps-key");
  });

  it("falls back to the coordinates when the address is empty", () => {
    const url = new URL(googleMapsEmbedUrl({ ...place, address: "   " })!);
    expect(url.searchParams.get("q")).toBe("51.0994,4.1025");
  });

  it("has no frame to offer without a key, but still has the link", () => {
    process.env.VITE_GOOGLE_MAPS_API_KEY = "";
    try {
      expect(googleMapsEmbedUrl(place)).toBeUndefined();
      // The Maps URL scheme needs no key, which is why the link is never conditional.
      expect(googleMapsLink(place)).toContain("https://www.google.com/maps/search/?api=1&query=");
    } finally {
      process.env.VITE_GOOGLE_MAPS_API_KEY = "test-maps-key";
    }
  });
});

describe("geocodeAddress", () => {
  const respondWith = (payload: unknown) => jest.spyOn(globalThis, "fetch").mockResolvedValue(
    { json: async () => payload } as unknown as Response);

  afterEach(() => jest.restoreAllMocks());

  it("reads the coordinates Google answers with", async () => {
    respondWith({ status: "OK", results: [{ geometry: { location: { lat: 51.0994, lng: 4.1025 } } }] });

    await expect(geocodeAddress("De Ruiter 12, Waasmunster"))
      .resolves.toEqual({ status: "found", latitude: 51.0994, longitude: 4.1025 });
  });

  it("asks Google's geocoder, with the key and the typed address", async () => {
    const fetchMock = respondWith({ status: "ZERO_RESULTS", results: [] });

    await geocodeAddress("Nergens 1");

    const requested = new URL(String(fetchMock.mock.calls[0][0]));
    expect(`${requested.origin}${requested.pathname}`).toBe("https://maps.googleapis.com/maps/api/geocode/json");
    expect(requested.searchParams.get("address")).toBe("Nergens 1");
    expect(requested.searchParams.get("key")).toBe("test-maps-key");
  });

  it("separates an address Google does not know from a request Google refused", async () => {
    respondWith({ status: "ZERO_RESULTS", results: [] });
    await expect(geocodeAddress("Nergens 1")).resolves.toEqual({ status: "none" });

    respondWith({ status: "REQUEST_DENIED", error_message: "This API project is not authorized" });
    await expect(geocodeAddress("De Ruiter 12")).resolves.toEqual({ status: "unavailable" });
  });

  it("reports a request that never completed", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(geocodeAddress("De Ruiter 12")).resolves.toEqual({ status: "failed" });
  });

  it("does not call Google at all when the build has no key", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({ json: async () => ({}) } as unknown as Response);
    process.env.VITE_GOOGLE_MAPS_API_KEY = "";
    try {
      await expect(geocodeAddress("De Ruiter 12")).resolves.toEqual({ status: "unavailable" });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      process.env.VITE_GOOGLE_MAPS_API_KEY = "test-maps-key";
    }
  });
});

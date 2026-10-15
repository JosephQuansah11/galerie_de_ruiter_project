import { act, renderHook } from "@testing-library/react";
import { useLocationAdmin } from "./useLocationAdmin";

/**
 * The administrator's address lookup goes through Google's geocoder now, and each outcome has its
 * own message: a typo, a key that needs attention and a connection that failed are three different
 * things to act on. This drives the hook the way the screen does.
 */
const respondWith = (payload: unknown) => jest.spyOn(globalThis, "fetch").mockResolvedValue(
  { json: async () => payload } as unknown as Response);

describe("the address lookup", () => {
  afterEach(() => jest.restoreAllMocks());

  it("fills the coordinates in when Google knows the address", async () => {
    respondWith({ status: "OK", results: [{ geometry: { location: { lat: 51.0994, lng: 4.1025 } } }] });
    const { result } = renderHook(() => useLocationAdmin());

    act(() => result.current.update("address", "De Ruiter 12, Waasmunster"));
    await act(async () => { await result.current.lookupAddress(); });

    expect(result.current.lookupMessage).toBe("coordinatesFound");
    expect(result.current.form.latitude).toBe(51.0994);
    expect(result.current.form.longitude).toBe(4.1025);
  });

  it("says so when the lookup cannot run at all", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({ json: async () => ({}) } as unknown as Response);
    process.env.VITE_GOOGLE_MAPS_API_KEY = "";
    try {
      const { result } = renderHook(() => useLocationAdmin());

      act(() => result.current.update("address", "De Ruiter 12, Waasmunster"));
      await act(async () => { await result.current.lookupAddress(); });

      expect(result.current.lookupMessage).toBe("addressLookupUnavailable");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      process.env.VITE_GOOGLE_MAPS_API_KEY = "test-maps-key";
    }
  });

  it("leaves the coordinates alone when Google knows no such address", async () => {
    respondWith({ status: "ZERO_RESULTS", results: [] });
    const { result } = renderHook(() => useLocationAdmin());
    const before = result.current.form;

    act(() => result.current.update("address", "Nergens 1"));
    await act(async () => { await result.current.lookupAddress(); });

    expect(result.current.lookupMessage).toBe("noMatchingAddress");
    expect(result.current.form.latitude).toBe(before.latitude);
  });
});

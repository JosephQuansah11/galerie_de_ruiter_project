import { screen } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import type { StoreLocation } from "@/apis/backend_api";
import { LocationMap } from "./LocationMap";

const location: StoreLocation = {
  id: "location-1",
  address: "De Ruiter 12, Waasmunster",
  openingHours: "Thursday to Sunday, 11:00 - 18:00",
  latitude: 51.0994,
  longitude: 4.1025,
};

const props = { title: "Kaart van Galerie de Ruiter", linkText: "Open in Google Maps" };

describe("the location map", () => {
  it("frames the gallery's address on Google Maps", () => {
    renderPage(<LocationMap location={location} {...props} />, { auth: false });

    const frame = screen.getByTitle(props.title);
    expect(frame).toHaveAttribute("src", expect.stringContaining("google.com/maps/embed/v1/place"));
    // URLSearchParams encodes a space as "+", so the address is read back rather than compared
    // against encodeURIComponent's answer.
    expect(new URL(frame.getAttribute("src")!).searchParams.get("q")).toBe(location.address);
    // Below the address on a phone, so it must not compete with the first paint.
    expect(frame).toHaveAttribute("loading", "lazy");
  });

  it("keeps the link, and drops the frame, when the build carries no key", () => {
    process.env.VITE_GOOGLE_MAPS_API_KEY = "";
    try {
      renderPage(<LocationMap location={location} {...props} />, { auth: false });

      expect(screen.queryByTitle(props.title)).toBeNull();
      expect(screen.getByRole("link", { name: new RegExp(props.linkText, "i") }))
        .toHaveAttribute("href", expect.stringContaining("google.com/maps/search"));
    } finally {
      process.env.VITE_GOOGLE_MAPS_API_KEY = "test-maps-key";
    }
  });
});

import { screen } from "@testing-library/react";
import { renderPage } from "../../test/renderPage";
import i18n from "../i18n";
import AboutPage from "./AboutPage";
import LocationPage from "./LocationPage";
import { getAboutContent, getStoreLocation } from "@/apis/backend_api";

jest.mock("@/apis/backend_api", () => ({
  getAboutContent: jest.fn(),
  getStoreLocation: jest.fn(),
}));

const mockedAbout = getAboutContent as jest.Mock;
const mockedLocation = getStoreLocation as jest.Mock;

beforeEach(() => {
  mockedAbout.mockResolvedValue({ content: "# Our story\n\nGalerie de Ruiter is a pop-up store in Waasmunster." });
  mockedLocation.mockResolvedValue({
    id: 1,
    address: "De Ruiter 12, Waasmunster",
    openingHours: "Thursday to Sunday, 11:00 - 18:00",
    latitude: 51.1,
    longitude: 4.08,
  });
});

describe("About page", () => {
  it("renders the gallery story from the content service", async () => {
    renderPage(<AboutPage />, { auth: false });

    expect(await screen.findByRole("heading", { level: 1, name: "Our story" })).toBeInTheDocument();
    expect(screen.getByText(/pop-up store in Waasmunster/)).toBeInTheDocument();
  });

  it("shows the live gallery location from the store location", async () => {
    renderPage(<AboutPage />, { auth: false });

    // The About page must use the same location record the concierge chat answers from,
    // not a hardcoded city in the story text.
    expect(await screen.findByText("De Ruiter 12, Waasmunster")).toBeInTheDocument();
    expect(screen.getByText("Thursday to Sunday, 11:00 - 18:00")).toBeInTheDocument();
  });

  it("reports a failing story request", async () => {
    mockedAbout.mockRejectedValueOnce(new Error("offline"));

    renderPage(<AboutPage />, { auth: false });

    expect(await screen.findByText(i18n.t("aboutLoadError"))).toBeInTheDocument();
  });

  it("names itself in the head, because a visitor and a crawler both reach it", async () => {
    renderPage(<AboutPage />, { auth: false });

    expect(document.title).toBe(i18n.t("metaAboutTitle"));
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute("href", expect.stringContaining("/about"));
  });

  it("names the city in the location heading and the title", async () => {
    renderPage(<AboutPage />, { auth: false });

    expect(await screen.findByRole("heading", { level: 2, name: /Waasmunster/ })).toBeInTheDocument();
    expect(document.title).toContain("Waasmunster");
  });
});

describe("Location page", () => {
  it("shows the address, the opening hours and the map", async () => {
    renderPage(<LocationPage />, { auth: false });

    expect(await screen.findByText("De Ruiter 12, Waasmunster")).toBeInTheDocument();
    expect(screen.getByText("Thursday to Sunday, 11:00 - 18:00")).toBeInTheDocument();
    // The frame is Google's Embed API, and the link beside it is the Maps URL scheme; the address
    // is what both search for, so the pin lands on the gallery rather than on bare coordinates.
    expect(screen.getByTitle(i18n.t("locationMapTitle"))).toHaveAttribute("src",
      expect.stringContaining("google.com/maps/embed/v1/place"));
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("openInMap"), "i") })).toHaveAttribute("href",
      expect.stringContaining("google.com/maps/search"));
  });

  it("names itself in the head, because a visitor and a crawler both reach it", async () => {
    renderPage(<LocationPage />, { auth: false });

    expect(document.title).toBe(i18n.t("metaMapTitle"));
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute("href", expect.stringContaining("/map"));
  });

  it("names the city in the heading and the title, because that is how it is searched for", async () => {
    renderPage(<LocationPage />, { auth: false });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Waasmunster");
    expect(document.title).toContain("Waasmunster");
    expect(document.title).toContain("Galerie de Ruiter");
  });

  it("says so when the gallery cannot be reached, instead of loading forever", async () => {
    mockedLocation.mockRejectedValueOnce(new Error("offline"));

    renderPage(<LocationPage />, { auth: false });

    expect(await screen.findByText(i18n.t("locationCouldNotLoad"))).toBeInTheDocument();
  });
});

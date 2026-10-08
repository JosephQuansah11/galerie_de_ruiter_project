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

  it("reports a failing story request", async () => {
    mockedAbout.mockRejectedValueOnce(new Error("offline"));

    renderPage(<AboutPage />, { auth: false });

    expect(await screen.findByText(i18n.t("aboutLoadError"))).toBeInTheDocument();
  });
});

describe("Location page", () => {
  it("shows the address, the opening hours and the map", async () => {
    renderPage(<LocationPage />, { auth: false });

    expect(await screen.findByText("De Ruiter 12, Waasmunster")).toBeInTheDocument();
    expect(screen.getByText("Thursday to Sunday, 11:00 - 18:00")).toBeInTheDocument();
    expect(screen.getByTitle(i18n.t("locationMapTitle"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("openInMap"), "i") })).toHaveAttribute("href", expect.stringContaining("openstreetmap.org"));
  });
});

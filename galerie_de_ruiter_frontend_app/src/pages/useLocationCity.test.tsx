import { screen } from "@testing-library/react";
import { renderPage } from "../../test/renderPage";
import WelcomePage from "./WelcomePage";
import { getStoreLocation } from "@/apis/backend_api";

jest.mock("@/apis/backend_api", () => ({
  ...jest.requireActual("@/apis/backend_api"),
  getStoreLocation: jest.fn(),
}));

const mockedLocation = getStoreLocation as jest.Mock;

/**
 * The landing page names the pop-up's city in its title and heading, and it takes that city from
 * the store location rather than from a string in the code.
 */
describe("useLocationCity", () => {
  afterEach(() => window.localStorage.removeItem("galerie-city"));

  it("names the city in the landing page heading and title", async () => {
    mockedLocation.mockResolvedValue({
      id: "1",
      address: "Groenselstraat 48 , Waasmunster",
      openingHours: "Zaterdag & Zondag van 10.00 tot 18.00",
      latitude: 51.1,
      longitude: 4.08,
    });

    renderPage(<WelcomePage />);

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Waasmunster");
    expect(document.title).toContain("Waasmunster");
  });

  it("keeps a complete title when the gallery's address is not filled in", async () => {
    mockedLocation.mockResolvedValue({ id: "1", address: "", openingHours: "", latitude: 0, longitude: 0 });

    renderPage(<WelcomePage />);

    expect(await screen.findByRole("heading", { level: 1 })).not.toHaveTextContent("undefined");
    expect(document.title).not.toContain("undefined");
  });

  it("starts from the city of the last visit, so the heading never shrinks and grows again", () => {
    // The document's first screen already names the city. Without the remembered answer the
    // application would take over with a shorter heading, grow it back when the store location
    // answered, and the largest-contentful-paint would follow that second growth.
    window.localStorage.setItem("galerie-city", "Waasmunster");
    mockedLocation.mockResolvedValue({
      id: "1",
      address: "Groenselstraat 48 , Waasmunster",
      openingHours: "",
      latitude: 51.1,
      longitude: 4.08,
    });

    renderPage(<WelcomePage />);

    // Read straight after rendering, before the location request has had a chance to resolve.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Waasmunster");
  });
});

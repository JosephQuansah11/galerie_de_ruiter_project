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
});

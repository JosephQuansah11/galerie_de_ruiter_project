import { screen } from "@testing-library/react";
import { renderPage } from "../test/renderPage";
import i18n from "./i18n";
import App from "./App";

jest.mock("@/apis/backend_api", () => ({
  getAboutContent: jest.fn().mockResolvedValue({
    content: "Galerie de Ruiter began as a hobby and grew into an eclectic mix.",
  }),
}));

/**
 * `App` provides its own BrowserRouter and AuthProvider, so these tests drive the real
 * shell: the jsdom URL selects the route and the mocked Keycloak double ends the
 * session check without touching the network.
 */
describe("App shell", () => {
  it("renders the sign-in page for the login route", async () => {
    window.history.pushState({}, "", "/login");
    renderPage(<App />, { auth: false, router: false });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(i18n.t("welcomeBack"));
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("continueKeycloak"), "i") })).toBeInTheDocument();
  });

  it("renders the public about page with the gallery story", async () => {
    window.history.pushState({}, "", "/about");
    renderPage(<App />, { auth: false, router: false });

    expect(await screen.findByText(/Galerie de Ruiter began as a hobby/i)).toBeInTheDocument();
  });
});


import { screen } from "@testing-library/react";
import { renderPage } from "../test/renderPage";
import i18n from "./i18n";
import App from "./App";

/**
 * `App` provides its own BrowserRouter and AuthProvider, so these tests drive the real
 * shell: the jsdom URL selects the route and the mocked Keycloak double ends the session
 * check without touching the network. That double is signed out, so these also pin down
 * what a visitor without an account may reach.
 */
describe("App shell", () => {
  it("renders the sign-in page for the login route", async () => {
    window.history.pushState({}, "", "/login");
    renderPage(<App />, { auth: false, router: false });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(i18n.t("welcomeBack"));
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("continueKeycloak"), "i") })).toBeInTheDocument();
    // Nobody asked for anything behind an account, so there is nothing to explain.
    expect(screen.queryByText(i18n.t("signInRequired"))).not.toBeInTheDocument();
  });

  it("lets a visitor read the gallery story", async () => {
    window.history.pushState({}, "", "/about");
    renderPage(<App />, { auth: false, router: false });

    // The page itself, not the sign-in redirect: it is loading the story from the gallery.
    expect(await screen.findByText(i18n.t("aboutLoading"))).toBeInTheDocument();
    expect(screen.queryByText(i18n.t("welcomeBack"))).not.toBeInTheDocument();
  });

  it("lets a visitor find the pop-up", async () => {
    window.history.pushState({}, "", "/map");
    renderPage(<App />, { auth: false, router: false });

    expect(await screen.findByText(i18n.t("loadingLocation"))).toBeInTheDocument();
    expect(screen.queryByText(i18n.t("welcomeBack"))).not.toBeInTheDocument();
  });

  it("shows a visitor the dashboard", async () => {
    window.history.pushState({}, "", "/dashboard");
    renderPage(<App />, { auth: false, router: false });

    expect(await screen.findByRole("heading", { level: 1, name: i18n.t("welcomeTitle") })).toBeInTheDocument();
    // The shell is available to a visitor, with a sign-in link where the profile menu sits.
    expect(screen.getByText(i18n.t("navGalleryChat"))).toBeInTheDocument();
    expect(screen.getByText(i18n.t("navSignIn"))).toBeInTheDocument();
  });

  it("lets a visitor talk to the concierge without reaching WhatsApp", async () => {
    window.history.pushState({}, "", "/dashboard/chat");
    renderPage(<App />, { auth: false, router: false });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(i18n.t("talkToGallery"));
    expect(screen.queryByRole("link", { name: i18n.t("messageOnWhatsApp") })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: i18n.t("chatWhatsappSignIn") })).toBeInTheDocument();
  });

  it.each(["/antiques", "/antiques/123", "/wishlist", "/cart", "/profile", "/preferences", "/admin/antiques"])(
    "sends a visitor who opens %s to the sign-in page",
    async (route) => {
      window.history.pushState({}, "", route);
      renderPage(<App />, { auth: false, router: false });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(i18n.t("welcomeBack"));
      // Acting on the collection needs an account, and the page says so instead of looking broken.
      expect(screen.getByText(i18n.t("signInRequired"))).toBeInTheDocument();
    },
  );
});


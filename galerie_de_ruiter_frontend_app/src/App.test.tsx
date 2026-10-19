import { screen } from "@testing-library/react";
import { renderPage } from "../test/renderPage";
import i18n from "./i18n";
import App from "./App";

/**
 * `App` provides its own BrowserRouter and AuthProvider, so these tests drive the real
 * shell: the jsdom URL selects the route and the stored session is empty, so the account
 * check finishes without touching the network. That is a visitor who is signed out, which
 * also pins down what they may reach.
 */
describe("App shell", () => {
  it("renders the sign-in page for the login route", async () => {
    window.history.pushState({}, "", "/login");
    renderPage(<App />, { auth: false, router: false });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(i18n.t("welcomeBack"));
    // The form signs in with an address or the gallery's legacy short username. There is no
    // identity-provider redirect left to offer.
    expect(screen.getByLabelText(i18n.t("signInIdentifier"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("signIn") })).toBeInTheDocument();
    // Nobody asked for anything behind an account, so there is nothing to explain.
    expect(screen.queryByText(i18n.t("signInRequired"))).not.toBeInTheDocument();
    // Sign-in is one of the two routes outside the application shell, so it brings its own
    // landmark: without one its content is in no landmark at all, which is what a screen reader
    // navigates by.
    expect(screen.getByRole("main")).toBeInTheDocument();
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

  it("shows a visitor the landing page", async () => {
    window.history.pushState({}, "", "/");
    renderPage(<App />, { auth: false, router: false });

    expect(await screen.findByRole("heading", { level: 1, name: i18n.t("welcomeTitle") })).toBeInTheDocument();
    // The shell is available to a visitor, with a sign-in link where the profile menu sits. The
    // page no longer waits for the account check, so the link arrives with the answer rather
    // than with the heading.
    expect(await screen.findByText(i18n.t("navSignIn"))).toBeInTheDocument();
    // The label appears twice now: the navigation shows it to a visitor, and the footer repeats the
    // four pages a visitor can reach without an account. So this asks for the link, not one element.
    expect(screen.getAllByRole("link", { name: i18n.t("navGalleryChat") }).length).toBeGreaterThan(0);
  });

  it.each(["/home", "/dashboard"])("sends the old landing-page address %s on to the root", async (route) => {
    // Both are 301s on the server; this is what an in-app link to one of them gets, so that the
    // two do not live on as a second page in the index.
    window.history.pushState({}, "", route);
    renderPage(<App />, { auth: false, router: false });

    expect(await screen.findByRole("heading", { level: 1, name: i18n.t("welcomeTitle") })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("lets a visitor talk to the concierge without reaching WhatsApp", async () => {
    window.history.pushState({}, "", "/chat");
    renderPage(<App />, { auth: false, router: false });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(i18n.t("talkToGallery"));
    expect(screen.queryByRole("link", { name: i18n.t("messageOnWhatsApp") })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: i18n.t("chatWhatsappSignIn") })).toBeInTheDocument();
  });

  it("lets a visitor read the first list of the collection", async () => {
    window.history.pushState({}, "", "/antiques");
    renderPage(<App />, { auth: false, router: false });

    // The list itself, not the sign-in redirect: an account is what the rest of it costs.
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(i18n.t("collectionTitle"));
    expect(screen.queryByText(i18n.t("welcomeBack"))).not.toBeInTheDocument();
  });

  it("lets a visitor open a piece's own page", async () => {
    window.history.pushState({}, "", "/antiques/123");
    renderPage(<App />, { auth: false, router: false });

    // The piece page is public content: it must answer as the piece page, not as the sign-in
    // redirect. This test run has no API behind it, so the page it can show is "not found".
    expect(await screen.findByText(i18n.t("pieceNotFound"))).toBeInTheDocument();
    expect(screen.queryByText(i18n.t("welcomeBack"))).not.toBeInTheDocument();
  });

  it.each(["/wishlist", "/cart", "/profile", "/preferences", "/admin/antiques", "/admin/dashboard"])(
    "sends a visitor who opens %s to the sign-in page",
    async (route) => {
      window.history.pushState({}, "", route);
      renderPage(<App />, { auth: false, router: false });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(i18n.t("welcomeBack"));
      // Acting on the collection needs an account, and the page says so instead of looking broken.
      expect(screen.getByText(i18n.t("signInRequired"))).toBeInTheDocument();
      // The requested page travels with the redirect, so signing in comes back to it rather than
      // dropping the visitor on the landing page.
      expect(window.location.pathname).toBe("/login");
      expect(new URLSearchParams(window.location.search).get("from")).toBe(route);
    },
  );
});


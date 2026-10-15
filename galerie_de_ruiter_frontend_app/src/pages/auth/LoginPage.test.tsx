import { fireEvent, screen } from "@testing-library/react";
import { flushPromises, renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import { getIdentityProviders } from "./authApi";
import { LoginPage } from "./LoginPage";

const mockAuth = {
  authenticated: false,
  loading: false,
  profile: undefined,
  avatarUrl: undefined,
  roles: [] as string[],
  isAdmin: false,
  login: jest.fn(),
  loginWithGoogle: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
  refreshAvatar: jest.fn(),
};

jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children?: unknown }) => children,
  useAuth: () => mockAuth,
  // The alias the sign-in page looks for in the provider list the API reports.
  GOOGLE_IDENTITY_PROVIDER: "google",
}));

jest.mock("./authApi", () => ({ getIdentityProviders: jest.fn() }));

const providers = getIdentityProviders as jest.MockedFunction<typeof getIdentityProviders>;

// Every test starts from a realm that offers Google, which is what the gallery's realm does.
beforeEach(() => providers.mockResolvedValue(["google"]));

describe("Sign-in page", () => {
  it("invites the visitor to continue with Keycloak", async () => {
    renderPage(<LoginPage />, { auth: false });
    await flushPromises();

    expect(screen.getByRole("heading", { level: 1, name: i18n.t("welcomeBack") })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("continueKeycloak"), "i") }));
    expect(mockAuth.login).toHaveBeenCalled();
  });

  it("offers Google as the third-party way in", async () => {
    renderPage(<LoginPage />, { auth: false });
    await flushPromises();

    // The button names the provider, which is what sends the visitor to Google rather than to
    // Keycloak's own page with a Google button on it.
    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("continueGoogle"), "i") }));
    expect(mockAuth.loginWithGoogle).toHaveBeenCalled();
    expect(mockAuth.login).not.toHaveBeenCalled();
  });

  it("links to registration and to the gallery chat", async () => {
    renderPage(<LoginPage />, { auth: false });
    await flushPromises();

    expect(screen.getByRole("link", { name: new RegExp(i18n.t("createAccount"), "i") })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("talkToGallery"), "i") })).toHaveAttribute("href", "/chat");
  });

  it("keeps the button off the page when the realm has no Google provider", async () => {
    providers.mockResolvedValue([]);
    renderPage(<LoginPage />, { auth: false });
    await flushPromises();

    // A Google button on a realm without the provider is a dead end: Keycloak has nothing to send
    // the visitor to, so the click ends on an error page with no way back.
    expect(screen.queryByRole("button", { name: new RegExp(i18n.t("continueGoogle"), "i") })).toBeNull();
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("continueKeycloak"), "i") })).toBeInTheDocument();
  });

  it("still offers Google when the API cannot answer", async () => {
    providers.mockRejectedValue(new Error("offline"));
    renderPage(<LoginPage />, { auth: false });
    await flushPromises();

    // The provider lives in Keycloak, not in this API, so a cold or unreachable API is no reason
    // to hide a button that would have worked.
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("continueGoogle"), "i") })).toBeInTheDocument();
  });
});

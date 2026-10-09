import { fireEvent, screen } from "@testing-library/react";
import { flushPromises, renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import { LoginPage } from "./LoginPage";

const mockAuth = {
  authenticated: false,
  loading: false,
  profile: undefined,
  avatarUrl: undefined,
  roles: [] as string[],
  isAdmin: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
  refreshAvatar: jest.fn(),
};

jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children?: unknown }) => children,
  useAuth: () => mockAuth,
}));

describe("Sign-in page", () => {
  it("invites the visitor to continue with Keycloak", async () => {
    renderPage(<LoginPage />, { auth: false });
    await flushPromises();

    expect(screen.getByRole("heading", { level: 1, name: i18n.t("welcomeBack") })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("continueKeycloak"), "i") }));
    expect(mockAuth.login).toHaveBeenCalled();
  });

  it("links to registration and to the gallery chat", async () => {
    renderPage(<LoginPage />, { auth: false });
    await flushPromises();

    expect(screen.getByRole("link", { name: new RegExp(i18n.t("createAccount"), "i") })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: new RegExp(i18n.t("talkToGallery"), "i") })).toHaveAttribute("href", "/chat");
  });
});

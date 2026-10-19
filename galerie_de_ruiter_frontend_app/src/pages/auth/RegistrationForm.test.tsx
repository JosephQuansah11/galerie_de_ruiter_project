import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import { RegistrationForm } from "./RegistrationForm";

const mockAuth = {
  authenticated: false,
  loading: false,
  token: undefined as string | undefined,
  profile: undefined,
  avatarUrl: undefined as string | undefined,
  roles: [] as string[],
  isAdmin: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
  refreshAvatar: jest.fn().mockResolvedValue(undefined),
};

jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children?: unknown }) => children,
  useAuth: () => mockAuth,
}));

const fillForm = (email = "marie@example.com") => {
  fireEvent.change(screen.getByLabelText(i18n.t("displayName")), { target: { value: " Marie " } });
  fireEvent.change(screen.getByLabelText(i18n.t("email")), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(i18n.t("password")), { target: { value: "a-long-passphrase" } });
};

const submitForm = () => {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("createAccountButton"), "i") }));
};

describe("Registration form", () => {
  beforeEach(() => mockAuth.register.mockReset());

  it("collects an address and a display name, and nothing that would invent a username", () => {
    renderPage(<RegistrationForm />, { auth: false });

    expect(screen.getByLabelText(i18n.t("displayName"))).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("email"))).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(i18n.t("password"))).toHaveAttribute("autocomplete", "new-password");
    // The form used to take a username and four names; both would now compete with the address
    // the account is actually filed under.
    expect(screen.queryByLabelText(i18n.t("username"))).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18n.t("firstName"))).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18n.t("lastName"))).not.toBeInTheDocument();
  });

  it("hands the address and display name to the auth client", async () => {
    mockAuth.register.mockResolvedValue(true);
    renderPage(<RegistrationForm />, { auth: false });

    fillForm();
    submitForm();

    await waitFor(() => expect(mockAuth.register).toHaveBeenCalledWith({
      displayName: " Marie ",
      email: "marie@example.com",
      password: "a-long-passphrase",
    }));
  });

  it("says where the confirmation link went when the project confirms addresses", async () => {
    mockAuth.register.mockResolvedValue(false);
    renderPage(<RegistrationForm />, { auth: false });

    fillForm();
    submitForm();

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent(i18n.t("registrationCheckInbox", { email: "marie@example.com" }));
  });

  it("says when the address is already in use", async () => {
    mockAuth.register.mockRejectedValue(new Error("user_already_exists"));
    renderPage(<RegistrationForm />, { auth: false });

    fillForm();
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(i18n.t("registrationEmailTaken"));
  });

  it("explains that the gallery's own domain cannot receive mail", async () => {
    mockAuth.register.mockRejectedValue(new Error("gallery_email_not_accepted"));
    renderPage(<RegistrationForm />, { auth: false });

    fillForm("josephquan@galerie-de-ruiter.be");
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(i18n.t("registrationGalleryEmail"));
  });

  it("falls back to the generic message and names the code it does not know", async () => {
    mockAuth.register.mockRejectedValue(new Error("http422"));
    renderPage(<RegistrationForm />, { auth: false });

    fillForm();
    submitForm();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(i18n.t("registrationError"));
    expect(alert).toHaveTextContent("http422");
  });
});

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import { ProfilePage } from "./ProfilePage";
import { uploadProfileAvatar } from "@/apis/profile_api";

const mockAuth = {
  authenticated: true,
  loading: false,
  token: "test-token",
  profile: { username: "de-ruiter", firstName: "De", lastName: "Ruiter", email: "" },
  avatarUrl: undefined as string | undefined,
  roles: ["USER"],
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

jest.mock("@/apis/profile_api", () => ({
  uploadProfileAvatar: jest.fn(),
  loadProfileAvatar: jest.fn().mockResolvedValue(undefined),
}));

const mockedUpload = uploadProfileAvatar as jest.Mock;

function avatarInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error("The avatar file input was not rendered.");
  return input as HTMLInputElement;
}

function submitProfile() {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("updateProfile"), "i") }));
}

beforeEach(() => {
  mockAuth.updateProfile.mockResolvedValue(undefined);
  mockedUpload.mockResolvedValue(undefined);
  mockAuth.avatarUrl = undefined;
});

describe("Profile page", () => {
  it("shows the signed-in member identity", async () => {
    renderPage(<ProfilePage />, { auth: false });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("de-ruiter");
    expect(screen.getByText(i18n.t("galleryMember"))).toBeInTheDocument();
  });

  it("saves the profile details the member typed", async () => {
    renderPage(<ProfilePage />, { auth: false });

    fireEvent.change(screen.getByLabelText(i18n.t("firstName")), { target: { value: " Dirk " } });
    fireEvent.change(screen.getByLabelText(i18n.t("lastName")), { target: { value: "De Ruiter" } });
    fireEvent.change(screen.getByLabelText(i18n.t("email")), { target: { value: "dirk@galerie.test" } });
    submitProfile();

    await waitFor(() => expect(mockAuth.updateProfile).toHaveBeenCalledWith({
      firstName: "Dirk",
      lastName: "De Ruiter",
      email: "dirk@galerie.test",
    }));
    expect(await screen.findByText(i18n.t("profileUpdateSucceeded"))).toBeInTheDocument();
  });

  it("leaves the profile form to the browser's required validation", async () => {
    renderPage(<ProfilePage />, { auth: false });

    submitProfile();

    // The email field is marked `required`, so the browser never submits the form.
    expect(mockAuth.updateProfile).not.toHaveBeenCalled();
  });

  it("refuses to send an update that is missing a required detail", async () => {
    renderPage(<ProfilePage />, { auth: false });

    // Submitting the form directly bypasses the browser's own required-field check and
    // covers the guard for values that only look filled in (for example whitespace).
    fireEvent.submit(document.querySelector("form.dynamic-form")!);

    expect(await screen.findByText(i18n.t("profileUpdateRequiredFields"))).toBeInTheDocument();
    expect(mockAuth.updateProfile).not.toHaveBeenCalled();
  });

  it("surfaces the reason when the API rejects the update", async () => {
    mockAuth.updateProfile.mockRejectedValueOnce(new Error("session expired"));
    renderPage(<ProfilePage />, { auth: false });

    fireEvent.change(screen.getByLabelText(i18n.t("email")), { target: { value: "dirk@galerie.test" } });
    submitProfile();

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(i18n.t("profileUpdateFailed"));
    expect(status).toHaveTextContent("session expired");
  });

  it("uploads a PNG profile image and confirms it", async () => {
    renderPage(<ProfilePage />, { auth: false });

    const file = new File([new Uint8Array([1, 2, 3])], "portrait.png", { type: "image/png" });
    fireEvent.change(avatarInput(), { target: { files: [file] } });

    await waitFor(() => expect(mockedUpload).toHaveBeenCalledWith(file));
    expect(await screen.findByText(i18n.t("profileImageUploadSucceeded"))).toBeInTheDocument();
    expect(mockAuth.refreshAvatar).toHaveBeenCalled();
  });

  it("rejects an image type the gallery cannot store", async () => {
    renderPage(<ProfilePage />, { auth: false });

    const file = new File([new Uint8Array([1, 2, 3])], "animated.gif", { type: "image/gif" });
    fireEvent.change(avatarInput(), { target: { files: [file] } });

    expect(await screen.findByText(i18n.t("profileImageUnsupported"))).toBeInTheDocument();
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("rejects an image above the 5 MB limit", async () => {
    renderPage(<ProfilePage />, { auth: false });

    const file = new File([new Uint8Array(6 * 1024 * 1024)], "huge.png", { type: "image/png" });
    fireEvent.change(avatarInput(), { target: { files: [file] } });

    expect(await screen.findByText(i18n.t("profileImageTooLarge"))).toBeInTheDocument();
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("explains a failed avatar upload", async () => {
    mockedUpload.mockRejectedValueOnce(new Error("csrf rejected"));
    renderPage(<ProfilePage />, { auth: false });

    const file = new File([new Uint8Array([1, 2, 3])], "portrait.png", { type: "image/png" });
    fireEvent.change(avatarInput(), { target: { files: [file] } });

    const alert = await screen.findByText(new RegExp(i18n.t("profileImageUploadFailed")));
    expect(alert).toHaveTextContent("csrf rejected");
  });
});

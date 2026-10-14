import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import { ChatHeader } from "./ChatHeader";
import { useAuth } from "@/context/AuthContext";

// The header asks who is signed in, so the page can be driven as a member without a
// Keycloak round trip.
jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children?: ReactNode }) => children,
}));

const mockedAuth = useAuth as jest.Mock;

const appointment = { at: "2030-11-01T10:00", type: "VISIT" as const };

function whatsappHref(): string {
  return screen.getByRole("link", { name: i18n.t("messageOnWhatsApp") }).getAttribute("href") ?? "";
}

describe("chat WhatsApp hand-off", () => {
  it("names the visitor with their first and last name", () => {
    mockedAuth.mockReturnValue({ authenticated: true,
      profile: { username: "joseph.q", firstName: "Joseph", lastName: "Quansah" } });

    renderPage(<ChatHeader appointment={appointment} />);

    expect(whatsappHref()).toContain(encodeURIComponent("My name is Joseph Quansah."));
  });

  it("never puts the account username in the message", () => {
    mockedAuth.mockReturnValue({ authenticated: true, profile: { username: "joseph.q" } });

    renderPage(<ChatHeader appointment={appointment} />);

    const href = whatsappHref();
    expect(href).not.toContain("joseph.q");
    expect(decodeURIComponent(href)).not.toContain("My name is");
  });
});

import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderPage } from "../../test/renderPage";
import i18n from "../i18n";
import ChatPage from "./ChatPage";
import { fetchChatStatus, sendChatMessage, warmUpChat } from "@/apis/chat_api";
import { useAuth } from "@/context/AuthContext";

jest.mock("@/apis/chat_api", () => ({
  fetchChatStatus: jest.fn(),
  sendChatMessage: jest.fn(),
  warmUpChat: jest.fn(),
}));

// The chat header and the assistant's sources both ask who is signed in, so the page can be
// driven as a visitor and as a member without a Keycloak round trip.
jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children?: ReactNode }) => children,
}));

const mockedStatus = fetchChatStatus as jest.Mock;
const mockedWarmUp = warmUpChat as jest.Mock;
const mockedSend = sendChatMessage as jest.Mock;
const mockedAuth = useAuth as jest.Mock;

beforeEach(() => {
  mockedAuth.mockReturnValue({ authenticated: false });
});

describe("Gallery chat page", () => {
  it("confirms the model connection before the visitor can type", async () => {
    mockedWarmUp.mockResolvedValue({ ready: false, model: "llama3.2:3b", detail: "The model is still loading." });

    renderPage(<ChatPage />);

    expect(await screen.findByText(i18n.t("chatNotReady"))).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("chatMessage"))).toBeDisabled();
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("chatOptionCollection"), "i") })).toBeDisabled();
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it("lets the visitor retry when the model is not ready yet", async () => {
    mockedWarmUp.mockResolvedValue({ ready: false, model: "llama3.2:3b", detail: "The model is still loading." });

    renderPage(<ChatPage />);
    await screen.findByRole("button", { name: new RegExp(i18n.t("chatRetry"), "i") });

    const attemptsBeforeRetry = mockedWarmUp.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("chatRetry"), "i") }));

    await waitFor(() => expect(mockedWarmUp.mock.calls.length).toBeGreaterThan(attemptsBeforeRetry));
  });

  it("keeps the connection for the session once the model is warm", async () => {
    mockedWarmUp.mockResolvedValue({ ready: true, model: "llama3.2:3b", detail: "The gallery assistant model is ready." });
    mockedStatus.mockResolvedValue({ ready: false, model: "llama3.2:3b", detail: "probe failed" });

    renderPage(<ChatPage />);

    // The page established the session connection when it opened…
    expect(mockedWarmUp).toHaveBeenCalled();
    const composer = await screen.findByLabelText(i18n.t("chatMessage"));
    await waitFor(() => expect(composer).toBeEnabled());

    // …so a later failing probe must not drop the visitor back to "connecting".
    await waitFor(() => expect(screen.queryByText(i18n.t("chatNotReady"))).not.toBeInTheDocument());
    expect(composer).toBeEnabled();
  });

  it("enables the composer and sends the prompt once the model is connected", async () => {
    mockedWarmUp.mockResolvedValue({ ready: true, model: "llama3.2:3b", detail: "The gallery assistant model is ready." });
    mockedSend.mockResolvedValue({
      message: "There are 7 visible categories.",
      appointmentConfirmed: false,
      appointmentHandoffRequired: false,
      sources: [],
    });

    renderPage(<ChatPage />);

    const composer = await screen.findByLabelText(i18n.t("chatMessage"));
    await waitFor(() => expect(composer).toBeEnabled());
    expect(screen.queryByText(i18n.t("chatNotReady"))).not.toBeInTheDocument();

    fireEvent.change(composer, { target: { value: "How many categories?" } });
    fireEvent.click(screen.getByRole("button", { name: i18n.t("sendMessage") }));

    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));
    expect(mockedSend.mock.calls[0][0]).toBe("How many categories?");
    expect(await screen.findByText("There are 7 visible categories.")).toBeInTheDocument();
    expect(screen.getByText("How many categories?")).toBeInTheDocument();
  });

  it("keeps a visitor away from WhatsApp when the assistant offers a hand-off", async () => {
    mockedWarmUp.mockResolvedValue({ ready: true, model: "llama3.2:3b", detail: "ready" });
    mockedSend.mockResolvedValue({
      message: "Please contact the gallery on WhatsApp.",
      appointmentConfirmed: false,
      appointmentHandoffRequired: false,
      sources: [{ title: "WhatsApp", url: "https://wa.me/32493357568" }],
    });

    renderPage(<ChatPage />);

    const composer = await screen.findByLabelText(i18n.t("chatMessage"));
    await waitFor(() => expect(composer).toBeEnabled());
    fireEvent.change(composer, { target: { value: "Can I book a visit?" } });
    fireEvent.click(screen.getByRole("button", { name: i18n.t("sendMessage") }));

    // The header button and the assistant's source both point at sign-in instead of WhatsApp.
    const signInLinks = await screen.findAllByRole("link", { name: i18n.t("chatWhatsappSignIn") });
    expect(signInLinks.length).toBeGreaterThan(0);
    signInLinks.forEach((link) => expect(link).toHaveAttribute("href", "/login"));
    expect(document.querySelector('a[href*="wa.me"]')).toBeNull();
  });

  it("offers the WhatsApp conversation once the visitor has signed in", async () => {
    mockedAuth.mockReturnValue({ authenticated: true });
    mockedWarmUp.mockResolvedValue({ ready: true, model: "llama3.2:3b", detail: "ready" });
    mockedSend.mockResolvedValue({
      message: "Please contact the gallery on WhatsApp.",
      appointmentConfirmed: false,
      appointmentHandoffRequired: false,
      sources: [{ title: "WhatsApp", url: "https://wa.me/32493357568" }],
    });

    renderPage(<ChatPage />);

    const composer = await screen.findByLabelText(i18n.t("chatMessage"));
    await waitFor(() => expect(composer).toBeEnabled());
    fireEvent.change(composer, { target: { value: "Can I book a visit?" } });
    fireEvent.click(screen.getByRole("button", { name: i18n.t("sendMessage") }));

    const whatsapp = await screen.findByRole("link", { name: new RegExp(i18n.t("whatsappContact"), "i") });
    expect(whatsapp).toHaveAttribute("href", "https://wa.me/32493357568");
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: i18n.t("messageOnWhatsApp") })).toHaveAttribute("href", expect.stringContaining("wa.me"));
  });

  it("explains a failed assistant request", async () => {
    mockedWarmUp.mockResolvedValue({ ready: true, model: "llama3.2:3b", detail: "ready" });
    mockedSend.mockRejectedValue(new Error("model offline"));

    renderPage(<ChatPage />);

    const composer = await screen.findByLabelText(i18n.t("chatMessage"));
    await waitFor(() => expect(composer).toBeEnabled());
    fireEvent.change(composer, { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: i18n.t("sendMessage") }));

    expect(await screen.findByText(i18n.t("chatUnavailable"))).toBeInTheDocument();
  });

  it("shows a status dot that proves the model service is running", async () => {
    mockedWarmUp.mockResolvedValue({ ready: true, model: "llama3.2:3b", detail: "ready" });

    renderPage(<ChatPage />);

    expect(await screen.findByText(i18n.t("chatStatusOnline"))).toBeInTheDocument();
    expect(document.querySelector(".chat-assistant-status.is-online .chat-status-dot")).not.toBeNull();
  });

  it("shows an offline status dot when the model service cannot be reached", async () => {
    mockedWarmUp.mockResolvedValue({ ready: false, model: "llama3.2:3b", detail: "" });

    renderPage(<ChatPage />);

    expect(await screen.findByText(i18n.t("chatStatusOffline"))).toBeInTheDocument();
    expect(document.querySelector(".chat-assistant-status.is-offline .chat-status-dot")).not.toBeNull();
  });

  it("closes an appointment request with a WhatsApp link that carries the slot", async () => {
    mockedAuth.mockReturnValue({ authenticated: true });
    mockedWarmUp.mockResolvedValue({ ready: true, model: "llama3.2:3b", detail: "ready" });
    mockedSend.mockResolvedValue({
      message: "Appointment request for a gallery visit (Saturday 1 November 2030 at 10:00) by the visitor is ready to send.",
      appointmentAt: "2030-11-01T10:00",
      appointmentType: "VISIT",
      appointmentConfirmed: false,
      appointmentHandoffRequired: false,
      sources: [{
        title: "WhatsApp",
        url: "https://wa.me/32493357568?text=Hello%20Galerie%20de%20Ruiter%2C%20I%20would%20like%20to%20request%20a%20gallery%20visit%20on%20Saturday%201%20November%202030%20at%2010%3A00",
      }],
    });

    renderPage(<ChatPage />);
    const composer = await screen.findByLabelText(i18n.t("chatMessage"));
    await waitFor(() => expect(composer).toBeEnabled());

    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("chatOptionAppointment"), "i") }));
    fireEvent.change(screen.getByLabelText(i18n.t("chatAppointmentDate")), { target: { value: "2030-11-01" } });
    fireEvent.change(screen.getByLabelText(i18n.t("chatAppointmentTime")), { target: { value: "10:00" } });
    fireEvent.click(screen.getByRole("button", { name: i18n.t("chatAppointmentRequest") }));

    // The closing reply carries the WhatsApp hand-off, pre-filled with the requested slot.
    const whatsapp = await screen.findByRole("link", { name: i18n.t("whatsappContact") });
    expect(whatsapp).toHaveAttribute("href", expect.stringContaining("wa.me/32493357568"));
    expect(whatsapp).toHaveAttribute("href", expect.stringContaining("text="));
    expect(screen.getByText(i18n.t("chatAppointmentSubmitted"))).toBeInTheDocument();
  });

  it("keeps the conversation open when the visitor leaves the page and returns", async () => {
    mockedWarmUp.mockResolvedValue({ ready: true, model: "llama3.2:3b", detail: "ready" });
    mockedSend.mockResolvedValue({
      message: "We have three mirrors in the collection.",
      appointmentConfirmed: false,
      appointmentHandoffRequired: false,
      sources: [],
    });

    const first = renderPage(<ChatPage />);
    const composer = await screen.findByLabelText(i18n.t("chatMessage"));
    await waitFor(() => expect(composer).toBeEnabled());
    fireEvent.change(composer, { target: { value: "Do you have mirrors?" } });
    fireEvent.click(screen.getByRole("button", { name: i18n.t("sendMessage") }));
    expect(await screen.findByText("We have three mirrors in the collection.")).toBeInTheDocument();

    // The session lasts for the visit: coming back restores the same thread instead of
    // starting over.
    first.unmount();
    renderPage(<ChatPage />);

    expect(await screen.findByText("Do you have mirrors?")).toBeInTheDocument();
    expect(screen.getByText("We have three mirrors in the collection.")).toBeInTheDocument();
  });
});

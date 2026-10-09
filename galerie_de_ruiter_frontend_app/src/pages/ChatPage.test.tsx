import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderPage } from "../../test/renderPage";
import i18n from "../i18n";
import ChatPage from "./ChatPage";
import { fetchChatStatus, sendChatMessage, warmUpChat } from "@/apis/chat_api";

jest.mock("@/apis/chat_api", () => ({
  fetchChatStatus: jest.fn(),
  sendChatMessage: jest.fn(),
  warmUpChat: jest.fn(),
}));

const mockedStatus = fetchChatStatus as jest.Mock;
const mockedWarmUp = warmUpChat as jest.Mock;
const mockedSend = sendChatMessage as jest.Mock;

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

  it("offers the WhatsApp conversation when the assistant hands the visitor over", async () => {
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
});

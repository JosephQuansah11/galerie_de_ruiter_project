import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderPage } from "../../test/renderPage";
import i18n from "../i18n";
import ChatPage from "./ChatPage";
import { fetchChatStatus, sendChatMessage } from "@/apis/chat_api";

jest.mock("@/apis/chat_api", () => ({
  fetchChatStatus: jest.fn(),
  sendChatMessage: jest.fn(),
}));

const mockedStatus = fetchChatStatus as jest.Mock;
const mockedSend = sendChatMessage as jest.Mock;

describe("Gallery chat page", () => {
  it("confirms the model connection before the visitor can type", async () => {
    mockedStatus.mockResolvedValue({ ready: false, model: "llama3.2:3b", detail: "The model is still loading." });

    renderPage(<ChatPage />);

    expect(await screen.findByText(i18n.t("chatNotReady"))).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("chatMessage"))).toBeDisabled();
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("chatOptionCollection"), "i") })).toBeDisabled();
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it("lets the visitor retry when the model is not ready yet", async () => {
    mockedStatus.mockResolvedValue({ ready: false, model: "llama3.2:3b", detail: "The model is still loading." });

    renderPage(<ChatPage />);
    await screen.findByRole("button", { name: new RegExp(i18n.t("chatRetry"), "i") });

    const attemptsBeforeRetry = mockedStatus.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("chatRetry"), "i") }));

    await waitFor(() => expect(mockedStatus.mock.calls.length).toBeGreaterThan(attemptsBeforeRetry));
  });

  it("enables the composer and sends the prompt once the model is connected", async () => {
    mockedStatus.mockResolvedValue({ ready: true, model: "llama3.2:3b", detail: "The gallery assistant model is ready." });
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

  it("explains a failed assistant request", async () => {
    mockedStatus.mockResolvedValue({ ready: true, model: "llama3.2:3b", detail: "ready" });
    mockedSend.mockRejectedValue(new Error("model offline"));

    renderPage(<ChatPage />);

    const composer = await screen.findByLabelText(i18n.t("chatMessage"));
    await waitFor(() => expect(composer).toBeEnabled());
    fireEvent.change(composer, { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: i18n.t("sendMessage") }));

    expect(await screen.findByText(i18n.t("chatUnavailable"))).toBeInTheDocument();
  });
});

import axiosInstance from "@/apis/authPromise";
import { sendChatMessage, warmUpChat } from "./chat_api";

jest.mock("@/apis/apiConfig", () => ({ apiBaseUrl: "https://galerie-java-api.test" }));
jest.mock("@/apis/authPromise", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedPost = axiosInstance.post as jest.Mock;
const timeoutOf = (call: number) => (mockedPost.mock.calls[call][2] as { timeout: number }).timeout;

/**
 * The shared client aborts a request after 15 seconds, which cancelled every reply from the
 * CPU-hosted model while the fast status probe still reported "ready". The chat calls must set
 * their own, longer window so the reply is not cut off mid-generation.
 */
describe("chat API request timeouts", () => {
  it("gives a model reply a window far longer than the 15s shared default", async () => {
    mockedPost.mockResolvedValue({
      data: { message: "hi", appointmentConfirmed: false, appointmentHandoffRequired: false, sources: [] },
    });

    await sendChatMessage("Hello");

    expect(timeoutOf(0)).toBeGreaterThanOrEqual(120000);
  });

  it("gives the warm-up enough time to load the model", async () => {
    mockedPost.mockResolvedValue({ data: { ready: true, model: "llama3.2:3b", detail: "" } });

    await warmUpChat();

    expect(timeoutOf(0)).toBeGreaterThanOrEqual(60000);
  });
});

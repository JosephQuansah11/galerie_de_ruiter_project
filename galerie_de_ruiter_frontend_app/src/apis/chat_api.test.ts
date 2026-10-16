import axiosInstance from "@/apis/authPromise";
import { sendChatMessage } from "./chat_api";

jest.mock("@/apis/apiConfig", () => ({ apiBaseUrl: "https://galerie-java-api.test" }));
jest.mock("@/apis/authPromise", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedPost = axiosInstance.post as jest.Mock;
const replyBody = { message: "hi", appointmentConfirmed: false, appointmentHandoffRequired: false, sources: [] };

/**
 * The chat request as the API expects it.
 *
 * It used to carry a three-minute timeout of its own, because a CPU-hosted model needed that long to
 * answer and the shared 15-second window cancelled every reply. The assistant now answers from the
 * gallery's own records, so the request is only about the question: the recent turns, the appointment
 * a visitor picked in the picker, and their language, which is what the reply comes back in.
 */
describe("the chat request", () => {
  it("sends the question, the history, the appointment and the visitor's language", async () => {
    mockedPost.mockResolvedValue({ data: replyBody });

    await sendChatMessage("How many pieces are there?", [{ role: "user", text: "Hello" }],
      { at: "2030-11-01T10:00", type: "VISIT" }, "en");

    expect(mockedPost.mock.calls[0][0]).toBe("https://galerie-java-api.test/api/chat");
    expect(mockedPost.mock.calls[0][1]).toEqual({
      message: "How many pieces are there?",
      history: [{ role: "user", text: "Hello" }],
      appointmentSelection: { at: "2030-11-01T10:00", type: "VISIT" },
      language: "en",
    });
    // No window of its own any more: a reply is a database read, and the shared one is generous.
    expect(mockedPost.mock.calls[0][2]).toBeUndefined();
  });

  it("sends only the question when that is all the visitor gave", async () => {
    mockedPost.mockResolvedValue({ data: replyBody });

    await sendChatMessage("Hallo");

    expect(mockedPost.mock.calls[0][1]).toEqual({
      message: "Hallo",
      history: [],
      appointmentSelection: undefined,
      language: undefined,
    });
  });
});

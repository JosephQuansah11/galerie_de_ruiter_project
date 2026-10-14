import { clearChatSession, readChatSession, writeChatSession } from "./chatSession";

describe("chat session storage", () => {
  it("has no conversation before one is started", () => {
    expect(readChatSession()).toBeUndefined();
  });

  it("round-trips the conversation and the appointment", () => {
    writeChatSession({
      messages: [{ role: "user", text: "Do you have mirrors?" }],
      appointment: { at: "2030-01-01T10:00", type: "VISIT" },
    });

    expect(readChatSession()).toEqual({
      messages: [{ role: "user", text: "Do you have mirrors?" }],
      appointment: { at: "2030-01-01T10:00", type: "VISIT" },
    });
  });

  it("ignores malformed stored content", () => {
    localStorage.setItem("galerie-chat-session", "{ not json");
    expect(readChatSession()).toBeUndefined();
  });

  it("ends the conversation when it is cleared", () => {
    writeChatSession({ messages: [{ role: "assistant", text: "Welcome" }] });
    clearChatSession();
    expect(readChatSession()).toBeUndefined();
  });
});

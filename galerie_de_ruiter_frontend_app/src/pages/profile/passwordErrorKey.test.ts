import { passwordErrorKey } from "./passwordErrorKey";

describe("passwordErrorKey", () => {
  it("turns the refusals a visitor can act on into their own sentence", () => {
    expect(passwordErrorKey("invalid_credentials")).toBe("passwordCurrentWrong");
    expect(passwordErrorKey("weak_password")).toBe("passwordTooWeak");
    expect(passwordErrorKey("same_password")).toBe("passwordUnchanged");
    expect(passwordErrorKey("over_request_rate_limit")).toBe("passwordRateLimited");
  });

  it("falls back to the generic message for a code it has never seen", () => {
    expect(passwordErrorKey("http500")).toBe("passwordChangeFailed");
    expect(passwordErrorKey("")).toBe("passwordChangeFailed");
  });
});

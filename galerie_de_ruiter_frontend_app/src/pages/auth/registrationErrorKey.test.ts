import { registrationErrorKey } from "./registrationErrorKey";

describe("registrationErrorKey", () => {
  it("turns the refusals a visitor can act on into their own sentence", () => {
    expect(registrationErrorKey("email_address_invalid")).toBe("registrationInvalidEmail");
    expect(registrationErrorKey("gallery_email_not_accepted")).toBe("registrationGalleryEmail");
    expect(registrationErrorKey("user_already_exists")).toBe("registrationEmailTaken");
    expect(registrationErrorKey("email_exists")).toBe("registrationEmailTaken");
    expect(registrationErrorKey("weak_password")).toBe("registrationWeakPassword");
    expect(registrationErrorKey("signup_disabled")).toBe("registrationDisabled");
    expect(registrationErrorKey("over_email_send_rate_limit")).toBe("registrationRateLimited");
    expect(registrationErrorKey("display_name_required")).toBe("registrationDisplayNameRequired");
  });

  it("falls back to the generic message for a code it has never seen", () => {
    expect(registrationErrorKey("http422")).toBe("registrationError");
    expect(registrationErrorKey("")).toBe("registrationError");
  });
});

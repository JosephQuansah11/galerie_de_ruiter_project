import { clearCsrfTokenCache, csrfHeaders, readCsrfCookie } from "./client";

/**
 * The CSRF token used to be fetched from `/api/login` before every write. The API already sets the
 * token in a readable cookie, so the app should use that and only ask when it has none - a second
 * request before every category or profile save was both slow and another thing that could fail
 * while the API was restarting.
 */
describe("CSRF headers", () => {
  beforeEach(() => {
    clearCsrfTokenCache();
    document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("uses the token cookie the API already set", async () => {
    document.cookie = "XSRF-TOKEN=cookie-token; path=/";

    expect(readCsrfCookie()).toBe("cookie-token");
    await expect(csrfHeaders()).resolves.toEqual({ "X-XSRF-TOKEN": "cookie-token" });
  });
});
import { GALLERY_EMAIL_DOMAIN, configureSupabase, isSupabaseConfigured, signIn, signOut, toEmail, refresh, updatePassword } from "./supabaseAuth";

describe("supabaseAuth", () => {
  const originalFetch = global.fetch;
  const calls: { url: string; init: RequestInit }[] = [];

  const reply = (status: number, body: unknown) => {
    global.fetch = jest.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
    }) as unknown as typeof fetch;
  };

  beforeEach(() => {
    calls.length = 0;
    // A project, so the client has somewhere to send to. Without one it refuses, which is the
    // behaviour the last test below checks.
    configureSupabase({ url: "https://project.supabase.co", key: "anon-key" });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("turns a bare username into the gallery's address", () => {
    expect(toEmail("de-ruiter")).toBe(`de-ruiter@${GALLERY_EMAIL_DOMAIN}`);
    expect(toEmail("  De-Ruiter ")).toBe(`de-ruiter@${GALLERY_EMAIL_DOMAIN}`);
  });

  it("leaves an address alone, so real-address accounts keep working", () => {
    expect(toEmail("Client@Example.com")).toBe("client@example.com");
  });

  it("signs in with the password grant and returns a session", async () => {
    reply(200, { access_token: "a", refresh_token: "r", expires_in: 3600, user: { id: "u1", email: "x@y" } });

    const session = await signIn("de-ruiter", "admin");

    expect(session).toMatchObject({ accessToken: "a", refreshToken: "r", userId: "u1" });
    expect(session.expiresAt).toBeGreaterThan(Date.now());
    expect(calls[0].url).toContain("/auth/v1/token?grant_type=password");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      email: `de-ruiter@${GALLERY_EMAIL_DOMAIN}`,
      password: "admin",
    });
  });

  it("surfaces Supabase's error code as the message to translate", async () => {
    reply(400, { error_code: "invalid_credentials" });

    await expect(signIn("de-ruiter", "wrong")).rejects.toThrow("invalid_credentials");
  });

  it("refreshes with the refresh token", async () => {
    reply(200, { access_token: "a2", refresh_token: "r2", expires_in: 3600, user: { id: "u1" } });

    const session = await refresh({ accessToken: "a", refreshToken: "r", expiresAt: 0, userId: "u1" });

    expect(session.accessToken).toBe("a2");
    expect(calls[0].url).toContain("grant_type=refresh_token");
  });

  it("does not throw when signing out fails, because the local session is cleared anyway", async () => {
    reply(401, { message: "token expired" });

    await expect(signOut({ accessToken: "a", refreshToken: "r", expiresAt: 0, userId: "u" })).resolves.toBeUndefined();
  });

  it("refuses to pretend to sign in when no project is configured", async () => {
    configureSupabase({ url: "", key: "" });
    expect(isSupabaseConfigured()).toBe(false);
    await expect(signIn("de-ruiter", "admin")).rejects.toThrow("authNotConfigured");
  });

  it("changes the password with the session's token, not with a password grant", async () => {
    reply(200, {});
    const session = { accessToken: "a", refreshToken: "r", expiresAt: 0, userId: "u1" };

    await updatePassword(session, "a-longer-passphrase");

    expect(calls[0].url).toContain("/auth/v1/user");
    expect(calls[0].init.method).toBe("PUT");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer a");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ password: "a-longer-passphrase" });
  });

  it("surfaces why a password was refused, so the form can say it", async () => {
    reply(422, { error_code: "weak_password" });

    await expect(updatePassword({ accessToken: "a", refreshToken: "r", expiresAt: 0, userId: "u" }, "short"))
      .rejects.toThrow("weak_password");
  });
});

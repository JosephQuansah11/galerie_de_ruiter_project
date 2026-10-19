import { GALLERY_EMAIL_DOMAIN, changePassword, configureSupabase, isEmailAddress, isGalleryAddress, isSupabaseConfigured, signIn, signOut, signUp, toEmail, refresh, updatePassword } from "./supabaseAuth";

describe("supabaseAuth", () => {
  const originalFetch = global.fetch;
  const calls: { url: string; init: RequestInit }[] = [];

  const reply = (status: number, body: unknown) => {
    global.fetch = jest.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
    }) as unknown as typeof fetch;
  };

  /** For a flow that makes more than one call; the last answer repeats if asked for more. */
  const replyInTurn = (answers: { status: number; body: unknown }[]) => {
    let index = 0;
    global.fetch = jest.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const answer = answers[Math.min(index++, answers.length - 1)];
      return { ok: answer.status >= 200 && answer.status < 300, status: answer.status, json: async () => answer.body } as unknown as Response;
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

  it("turns a bare username into the gallery's address, so de-ruiter can still sign in", () => {
    expect(toEmail("de-ruiter")).toBe(`de-ruiter@${GALLERY_EMAIL_DOMAIN}`);
    expect(toEmail("  De-Ruiter ")).toBe(`de-ruiter@${GALLERY_EMAIL_DOMAIN}`);
  });

  it("tells an address from a username", () => {
    expect(isEmailAddress("client@example.com")).toBe(true);
    expect(isEmailAddress(" de-ruiter ")).toBe(false);
    expect(isEmailAddress("client@example")).toBe(false);
  });

  it("recognises the gallery's own domain, which is not a mailbox", () => {
    expect(isGalleryAddress(`de-ruiter@${GALLERY_EMAIL_DOMAIN}`)).toBe(true);
    expect(isGalleryAddress(` Joseph@${GALLERY_EMAIL_DOMAIN.toUpperCase()} `)).toBe(true);
    expect(isGalleryAddress("client@example.com")).toBe(false);
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

  it("signs up with the address as given, never with the gallery's domain", async () => {
    reply(200, { access_token: "a", refresh_token: "r", expires_in: 3600, user: { id: "u2", email: "client@example.com" } });

    const session = await signUp({ email: " Client@Example.com ", password: "a-long-passphrase", displayName: "  Marie  " });

    expect(session?.userId).toBe("u2");
    expect(calls[0].url).toContain("/auth/v1/signup");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      email: "client@example.com",
      password: "a-long-passphrase",
      data: { username: "Marie", full_name: "Marie" },
    });
  });

  it("refuses to invent an address nobody can receive mail at", async () => {
    await expect(signUp({ email: "de-ruiter", password: "a-long-passphrase", displayName: "Jan" }))
      .rejects.toThrow("email_address_invalid");
    expect(calls).toHaveLength(0);
  });

  it("refuses the gallery's own domain for a new account", async () => {
    // This is the address an old client invented from a username. Nothing at that domain receives
    // mail, and Supabase rejects it, so a new account must never be filed under it.
    await expect(signUp({
      email: `josephquan@${GALLERY_EMAIL_DOMAIN}`,
      password: "a-long-passphrase",
      displayName: "Joseph",
    })).rejects.toThrow("gallery_email_not_accepted");
    expect(calls).toHaveLength(0);
  });

  it("asks for the name the gallery should use", async () => {
    await expect(signUp({ email: "client@example.com", password: "a-long-passphrase", displayName: "  " }))
      .rejects.toThrow("display_name_required");
    expect(calls).toHaveLength(0);
  });

  it("returns no session when the project asks the visitor to confirm the address", async () => {
    reply(200, { id: "u2", email: "client@example.com" });

    await expect(signUp({ email: "client@example.com", password: "a-long-passphrase", displayName: "Marie" }))
      .resolves.toBeNull();
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

  it("proves the current password before writing a new one", async () => {
    replyInTurn([
      { status: 200, body: { access_token: "a2", refresh_token: "r2", expires_in: 3600, user: { id: "u1", email: "client@example.com" } } },
      { status: 200, body: {} },
    ]);

    const session = await changePassword("client@example.com", "old-passphrase", "new-passphrase");

    // The fresh session, not the one the page was holding: it is what the write was made with.
    expect(session.accessToken).toBe("a2");
    expect(calls[0].url).toContain("grant_type=password");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      email: "client@example.com",
      password: "old-passphrase",
    });
    expect(calls[1].url).toContain("/auth/v1/user");
    expect(calls[1].init.method).toBe("PUT");
    expect((calls[1].init.headers as Record<string, string>).Authorization).toBe("Bearer a2");
    expect(JSON.parse(String(calls[1].init.body))).toEqual({ password: "new-passphrase" });
  });

  it("writes nothing when the current password is refused", async () => {
    reply(400, { error_code: "invalid_credentials" });

    await expect(changePassword("client@example.com", "wrong-passphrase", "new-passphrase"))
      .rejects.toThrow("invalid_credentials");
    // The password grant is the only request: no token came back, so no password was written.
    expect(calls).toHaveLength(1);
  });
});

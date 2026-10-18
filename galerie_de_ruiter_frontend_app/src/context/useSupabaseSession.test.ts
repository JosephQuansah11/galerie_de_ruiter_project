import { claimsOf, profileFromClaims, readSession, rolesOf, writeSession } from "./useSupabaseSession";

const tokenWith = (claims: Record<string, unknown>): string => {
  const encode = (value: unknown) => window.btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encode({ alg: "HS256" })}.${encode(claims)}.signature`;
};

describe("supabase session", () => {
  it("reads the roles from app_metadata, which only the server can write", () => {
    const claims = claimsOf(tokenWith({ app_metadata: { roles: ["admin"] } }));

    expect(rolesOf(claims)).toEqual(["admin"]);
  });

  it("ignores roles a user could grant themselves in user_metadata", () => {
    const claims = claimsOf(tokenWith({ user_metadata: { roles: ["admin"] } }));

    expect(rolesOf(claims)).toEqual([]);
  });

  it("survives a token it cannot read instead of throwing", () => {
    expect(claimsOf("not-a-token")).toBeUndefined();
    expect(claimsOf(undefined)).toBeUndefined();
    expect(rolesOf(undefined)).toEqual([]);
  });

  it("describes the visitor from the claims the token carries", () => {
    const claims = claimsOf(tokenWith({
      email: "de-ruiter@galerie-de-ruiter.be",
      user_metadata: { username: "de-ruiter", first_name: "Jan" },
    }));

    expect(profileFromClaims(claims)).toEqual({
      username: "de-ruiter",
      email: "de-ruiter@galerie-de-ruiter.be",
      firstName: "Jan",
      lastName: undefined,
    });
  });

  it("stores and reads back a session, and forgets a malformed one", () => {
    const session = { accessToken: "a", refreshToken: "r", expiresAt: 1, userId: "u1" };

    writeSession(session);
    expect(readSession()).toEqual(session);

    window.localStorage.setItem("galerie.session", "{not json");
    expect(readSession()).toBeUndefined();
  });
});

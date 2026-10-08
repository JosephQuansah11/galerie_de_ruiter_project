/**
 * Global module mocks for component tests.
 *
 * Keycloak is replaced with an inert double so pages render as a signed-out visitor
 * without network access or redirects. Individual tests override the pieces they need.
 */
jest.mock("@/context/keycloakClient", () => {
  const keycloak = {
    authenticated: false,
    token: undefined,
    tokenParsed: undefined,
    init: jest.fn().mockResolvedValue(false),
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    updateToken: jest.fn().mockResolvedValue(false),
    clearToken: jest.fn(),
    onAuthRefreshSuccess: undefined,
    onAuthLogout: undefined,
    onTokenExpired: undefined,
  };
  return { keycloak };
});

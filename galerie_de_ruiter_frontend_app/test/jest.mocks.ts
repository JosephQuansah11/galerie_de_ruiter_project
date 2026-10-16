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
    refreshToken: undefined,
    idToken: undefined,
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

/**
 * The dashboard copy is fetched by the welcome page. Tests always start from "nothing
 * written yet", which is what makes the translated defaults show up.
 */
jest.mock("@/apis/home_api", () => ({
  getHomeContent: jest.fn().mockResolvedValue({
    heroTitle: null,
    heroIntro: null,
    philosophyText: null,
    visitText: null,
    storyParagraphs: null,
  }),
  updateHomeContent: jest.fn(),
  getHomeImages: jest.fn().mockResolvedValue([]),
  uploadHomeImage: jest.fn(),
  deleteHomeImage: jest.fn(),
  resolveHomeImageUrl: (url: string) => url,
}));

/**
 * Pages keep a little state in the browser (the chat session, the chosen language, cached
 * responses). Reset it before each test so one test cannot leak a conversation, a language
 * or a cached response into the next.
 */
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("galerie-language", "en");
});

import { analyticsChoice, denyAnalytics, grantAnalytics, isAnalyticsHost, startAnalytics } from "./clarity";

/** The Clarity tag's queue, as the vendor snippet leaves it. */
const clarityQueue = () => (window as unknown as { clarity?: { q?: unknown[][] } }).clarity?.q;

const GALLERY = "galeriederuiterantieks.gripe";
/** The gallery's earlier free host; it is retired and must not receive analytics. */
const RETIRED_GALLERY = "galeriederuiter.cloud-ip.cc";
const KEY = "galerie-analytics-consent";
const TAG = 'script[data-galerie-clarity]';

beforeEach(() => {
  window.localStorage.clear();
  document.querySelectorAll(TAG).forEach((tag) => tag.remove());
  delete (window as unknown as { clarity?: unknown }).clarity;
});

describe("analytics consent", () => {
  it("only treats the gallery's own domain as production", () => {
    expect(isAnalyticsHost(GALLERY)).toBe(true);
    // The earlier free host is retired: a session recorded there would belong to a site the
    // gallery no longer publishes.
    expect(isAnalyticsHost(RETIRED_GALLERY)).toBe(false);
    expect(isAnalyticsHost("localhost")).toBe(false);
    expect(isAnalyticsHost("galerie-frontend.onrender.com")).toBe(false);
  });

  it("loads nothing before the visitor has chosen", () => {
    startAnalytics(GALLERY);

    expect(document.querySelector(TAG)).toBeNull();
    expect(analyticsChoice()).toBeNull();
  });

  it("loads the vendor tag and grants consent after a yes", () => {
    grantAnalytics(GALLERY);

    const tag = document.querySelector<HTMLScriptElement>(TAG);
    expect(tag?.src).toBe("https://www.clarity.ms/tag/z0549z8r1v?ref=bwt");
    expect(analyticsChoice()).toBe("granted");
    expect(clarityQueue()).toContainEqual(["consentv2", { ad_Storage: "granted", analytics_Storage: "granted" }]);
  });

  it("starts the tag on a later visit only when the answer was yes", () => {
    window.localStorage.setItem(KEY, "denied");
    startAnalytics(GALLERY);
    expect(document.querySelector(TAG)).toBeNull();

    window.localStorage.setItem(KEY, "granted");
    startAnalytics(GALLERY);
    expect(document.querySelector(TAG)).not.toBeNull();
  });

  it("never loads the tag off the gallery's host", () => {
    grantAnalytics("localhost");

    expect(document.querySelector(TAG)).toBeNull();
    expect(analyticsChoice()).toBe("granted");
  });

  it("withdraws consent and asks Clarity to erase its cookies", () => {
    grantAnalytics(GALLERY);

    denyAnalytics();

    expect(analyticsChoice()).toBe("denied");
    expect(clarityQueue()).toContainEqual(["consent", false]);
  });

  it("treats an answer it does not understand as no answer", () => {
    window.localStorage.setItem(KEY, "maybe");

    expect(analyticsChoice()).toBeNull();
  });
});
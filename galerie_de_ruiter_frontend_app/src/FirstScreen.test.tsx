import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "@testing-library/react";
import { createRoot } from "react-dom/client";
import i18n from "@/i18n";
import { titleWithCity } from "@/services/pageTitle";
import App from "@/App";
import { PageProviders } from "../test/renderPage";

/**
 * The first screen lives in index.html rather than in the bundle: it is what a visitor sees while
 * the stylesheet, the bundle and the account check are still on their way, and it is the reason
 * the first contentful paint is not the bundle's first render. These tests keep it honest. React
 * has to replace it rather than add to it, and its copy has to be the copy the page falls back to:
 * a first screen with different words would change the text under the visitor, and a heading
 * shorter than the real one would report the real one as a later paint.
 */
const indexHtml = readFileSync(join(__dirname, "..", "index.html"), "utf8");
const firstScreen = new DOMParser().parseFromString(indexHtml, "text/html").getElementById("root");
const copy = (selector: string) => firstScreen?.querySelector(selector)?.textContent?.trim();
/**
 * The document is written in the gallery's own language, because that is the one the document can
 * know: it is served before anything has read the visitor's saved choice. An English visitor sees
 * Dutch for as long as it takes the bundle to replace this screen, which is the same trade the
 * rest of the document makes.
 */
const gallery = i18n.getFixedT("nl-BE");

describe("the first screen in index.html", () => {
  it("carries the copy the landing page falls back to", () => {
    expect(copy(".welcome-hero h1")).toBe(titleWithCity(gallery, "welcomeTitle", "Waasmunster"));
    expect(copy(".welcome-hero-copy p")).toBe(gallery("welcomeIntro"));
    expect(copy(".catalogue-artist")).toBe(gallery("galleryName"));
    expect(copy(".welcome-actions .btn-dark")).toBe(gallery("explore"));
    expect(copy(".welcome-actions .btn-outline-dark")).toBe(gallery("talkToGallery"));
  });

  it("carries the navigation a visitor gets", () => {
    expect(copy(".navbar-wordmark")).toBe(gallery("galleryName"));
    // The brand goes to the landing page, and the landing page is the root: `/home` is a redirect
    // to it, so a shell that linked `/home` would send a visitor through one.
    expect(firstScreen?.querySelector(".navbar-brand-div")?.getAttribute("href")).toBe("/");
    const links = [...(firstScreen?.querySelectorAll(".main-navbar-links .nav-item-link") ?? [])]
      .map((link) => link.textContent?.trim());
    expect(links).toEqual([gallery("browseAntiques"), gallery("navGalleryChat"), gallery("navAbout"), gallery("location")]);
    expect(copy(".icons-list-user-profile .nav-item-link")).toBe(gallery("navSignIn"));
  });

  it("declares no canonical, because the document is served for every route", () => {
    // A canonical written into this document names one URL for all of them, and the pages it named
    // were reported as "canonical to a different URL" - an instruction to drop them from the index.
    // Each page declares its own at runtime instead; src/staticDocument.test.ts holds that end.
    expect(firstScreen?.ownerDocument.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("reserves the logo's box, so the picture cannot push the copy around", () => {
    const logo = firstScreen?.querySelector(".welcome-logo");
    expect(logo?.getAttribute("src")).toBe("/images/galerie_de_ruiter.png");
    expect(logo?.getAttribute("width")).toBe("276");
    expect(logo?.getAttribute("height")).toBe("578");
  });

  it("is replaced by the application instead of being kept beside it", async () => {
    const container = document.createElement("div");
    container.innerHTML = firstScreen?.innerHTML ?? "";
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<PageProviders auth={false} router={false}><App /></PageProviders>);
    });
    // One hero: the application's, not the document's copy next to it.
    expect(container.querySelectorAll(".welcome-hero")).toHaveLength(1);
    expect(container.querySelector(".icons-list-user-profile .nav-item-link")).not.toBeNull();
    await act(async () => root.unmount());
    container.remove();
  });
});

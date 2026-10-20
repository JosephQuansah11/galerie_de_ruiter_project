import { render } from "@testing-library/react";
import { usePageMeta } from "./usePageMeta";

function Page({ title, description, canonicalPath, noindex, image, imageAlt }: {
  title?: string; description?: string; canonicalPath?: string; noindex?: boolean; image?: string; imageAlt?: string;
}) {
  usePageMeta({ title, description, canonicalPath, noindex, image, imageAlt });
  return <p>{title ?? "loading"}</p>;
}

function canonicalHref(): string | null | undefined {
  return document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href");
}

function metaContent(attribute: "name" | "property", value: string): string | null | undefined {
  return document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`)?.getAttribute("content");
}

describe("page metadata", () => {
  it("gives the route its own title, description and canonical URL", () => {
    render(<Page title="Chat met Galerie de Ruiter" description="Stel je vragen."
      canonicalPath="/chat" />);

    expect(document.title).toBe("Chat met Galerie de Ruiter");
    expect(metaContent("name", "description")).toBe("Stel je vragen.");
    expect(metaContent("property", "og:title")).toBe("Chat met Galerie de Ruiter");
    expect(canonicalHref()).toBe("https://galeriederuiterantieks.gripe/chat");
    // Indexable pages allow the large preview Google Images and Discover use, and fall back to
    // the gallery logo when the page has no photograph of its own.
    expect(metaContent("name", "robots")).toBe("index, follow, max-image-preview:large");
    expect(metaContent("property", "og:image")).toBe("https://galeriederuiterantieks.gripe/logo512.png");
    expect(metaContent("property", "og:image:alt")).toBe("Chat met Galerie de Ruiter");
  });

  it("declares the gallery's own origin, whatever host served the page", () => {
    // Render serves the same site on its own onrender.com domain. A canonical built from the host
    // would let that host declare itself canonical for every page, and a search engine would then
    // be choosing between copies of the whole site instead of consolidating them on the domain the
    // gallery owns.
    render(<Page title="Chat met Galerie de Ruiter" canonicalPath="/chat" />);

    expect(window.location.origin).not.toBe("https://galeriederuiterantieks.gripe");
    expect(canonicalHref()).toBe("https://galeriederuiterantieks.gripe/chat");
    expect(metaContent("property", "og:url")).toBe("https://galeriederuiterantieks.gripe/chat");
  });

  it("follows the visitor to the next route", () => {
    const { rerender } = render(<Page title="Chat met Galerie de Ruiter" canonicalPath="/chat" />);

    rerender(<Page title="De collectie — Galerie de Ruiter" canonicalPath="/antiques" />);

    expect(document.title).toBe("De collectie — Galerie de Ruiter");
    expect(canonicalHref()).toBe("https://galeriederuiterantieks.gripe/antiques");
  });

  it("gives a piece its own image, then puts the gallery logo back", () => {
    const { rerender } = render(<Page title="Vaas — Galerie de Ruiter" canonicalPath="/antiques/piece-1"
      image="https://galerie-java-api.onrender.com/api/antiques/piece-1/image/photo-1/large"
      imageAlt="Vaas" />);

    expect(metaContent("property", "og:image"))
      .toBe("https://galerie-java-api.onrender.com/api/antiques/piece-1/image/photo-1/large");
    expect(metaContent("property", "og:image:alt")).toBe("Vaas");
    expect(metaContent("name", "twitter:image"))
      .toBe("https://galerie-java-api.onrender.com/api/antiques/piece-1/image/photo-1/large");

    rerender(<Page title="De collectie — Galerie de Ruiter" canonicalPath="/antiques" />);

    expect(metaContent("property", "og:image")).toBe("https://galeriederuiterantieks.gripe/logo512.png");
    expect(metaContent("property", "og:image:alt")).toBe("De collectie — Galerie de Ruiter");
  });

  it("keeps the sign-in pages out of the results", () => {
    const { rerender } = render(<Page title="Aanmelden — Galerie de Ruiter" noindex />);

    expect(metaContent("name", "robots")).toBe("noindex, follow");

    rerender(<Page title="Galerie de Ruiter — antiek en kunst" />);

    expect(metaContent("name", "robots")).toBe("index, follow, max-image-preview:large");
  });

  it("leaves the title alone while a page is still loading", () => {
    const { rerender } = render(<Page title="Aanmelden — Galerie de Ruiter" canonicalPath="/login" />);

    rerender(<Page canonicalPath="/antiques/piece-1" />);

    expect(document.title).toBe("Aanmelden — Galerie de Ruiter");

    rerender(<Page title="Vaas — Galerie de Ruiter" canonicalPath="/antiques/piece-1" />);

    expect(document.title).toBe("Vaas — Galerie de Ruiter");
  });
});

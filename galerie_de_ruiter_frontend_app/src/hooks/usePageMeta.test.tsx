import { render } from "@testing-library/react";
import { usePageMeta } from "./usePageMeta";

function Page({ title, description, canonicalPath, noindex }: {
  title?: string; description?: string; canonicalPath?: string; noindex?: boolean;
}) {
  usePageMeta({ title, description, canonicalPath, noindex });
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
    expect(canonicalHref()).toBe("http://localhost/chat");
  });

  it("follows the visitor to the next route", () => {
    const { rerender } = render(<Page title="Chat met Galerie de Ruiter" canonicalPath="/chat" />);

    rerender(<Page title="De collectie — Galerie de Ruiter" canonicalPath="/antiques" />);

    expect(document.title).toBe("De collectie — Galerie de Ruiter");
    expect(canonicalHref()).toBe("http://localhost/antiques");
  });

  it("keeps the sign-in pages out of the results", () => {
    const { rerender } = render(<Page title="Aanmelden — Galerie de Ruiter" noindex />);

    expect(metaContent("name", "robots")).toBe("noindex, follow");

    rerender(<Page title="Galerie de Ruiter — antiek en kunst" />);

    expect(metaContent("name", "robots")).toBeUndefined();
  });

  it("leaves the title alone while a page is still loading", () => {
    const { rerender } = render(<Page title="Aanmelden — Galerie de Ruiter" canonicalPath="/login" />);

    rerender(<Page canonicalPath="/antiques/piece-1" />);

    expect(document.title).toBe("Aanmelden — Galerie de Ruiter");

    rerender(<Page title="Vaas — Galerie de Ruiter" canonicalPath="/antiques/piece-1" />);

    expect(document.title).toBe("Vaas — Galerie de Ruiter");
  });
});

import { useEffect } from "react";

type PageMeta = {
  /** The page's full `<title>`, already translated. Omitted while a page is still loading. */
  title?: string;
  /** The `<meta name="description">` for the page, already translated. */
  description?: string;
  /** Path the page is indexed under; defaults to the path being rendered, query included. */
  canonicalPath?: string;
  /** Keeps a utility page — sign-in, registration — out of the search results. */
  noindex?: boolean;
};

/**
 * Gives a route its own title, description and canonical URL.
 *
 * The application ships as a single HTML page, so index.html carries one title and one
 * description for every route. Pages call this hook with their own translated copy and the
 * head follows the route, which is what a search engine reads after it runs the bundle.
 */
export function usePageMeta({ title, description, canonicalPath, noindex }: PageMeta) {
  useEffect(() => {
    if (title) document.title = title;
    // A page that does not describe itself keeps the site-wide description from index.html.
    setNamedMeta("description", description);
    if (noindex) setNamedMeta("robots", "noindex, follow");
    else removeNamedMeta("robots");
    setPropertyMeta("og:title", title);
    setPropertyMeta("og:description", description);
    setPropertyMeta("og:url", absoluteUrl(canonicalPath));
    setCanonical(absoluteUrl(canonicalPath));
  }, [title, description, canonicalPath, noindex]);
}

function absoluteUrl(path?: string): string {
  const target = path ?? `${window.location.pathname}${window.location.search}`;
  return new URL(target, window.location.origin).toString();
}

function metaTag(attribute: "name" | "property", value: string): HTMLMetaElement | undefined {
  return document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`) ?? undefined;
}

/** Adds or updates a `<meta>` tag; an undefined value leaves whatever the page already had. */
function setMeta(attribute: "name" | "property", value: string, content?: string): void {
  if (!content) return;
  const tag = metaTag(attribute, value) ?? document.head.appendChild(document.createElement("meta"));
  tag.setAttribute(attribute, value);
  tag.setAttribute("content", content);
}

function setNamedMeta(name: string, content?: string): void {
  setMeta("name", name, content);
}

function setPropertyMeta(property: string, content?: string): void {
  setMeta("property", property, content);
}

function removeNamedMeta(name: string): void {
  metaTag("name", name)?.remove();
}

function setCanonical(href: string): void {
  const link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?? document.head.appendChild(document.createElement("link"));
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", href);
}

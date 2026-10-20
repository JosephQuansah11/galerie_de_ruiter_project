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
  /** The page's representative image, absolute or relative. Defaults to the gallery logo. */
  image?: string;
  /** Alt text for the representative image; defaults to the page title. */
  imageAlt?: string;
};

/**
 * The gallery's own origin, fixed at build time from `site.config.mjs` (see webpack.config.js).
 *
 * The canonical URL has to name the gallery rather than whichever host served the page: Render
 * serves the same site on its `onrender.com` domain as well, so a canonical built from
 * `window.location.origin` let that domain declare itself canonical for every page, which is how a
 * search engine ends up choosing between two copies of the whole site. The fallback keeps a build
 * without the define working.
 */
const SITE_ORIGIN = import.meta.env.SITE_URL;
/** Large previews are what Google Images and Discover can show for a page. */
const INDEXABLE_ROBOTS = "index, follow, max-image-preview:large";
const DEFAULT_IMAGE_PATH = "/logo512.png";
const DEFAULT_IMAGE_ALT = "Galerie de Ruiter";

/**
 * Gives a route its own title, description, canonical URL and representative image.
 *
 * The application ships as a single HTML page, so index.html carries one title and one
 * description for every route. Pages call this hook with their own translated copy and the
 * head follows the route, which is what a search engine reads after it runs the bundle.
 *
 * `og:image` is set on every route rather than only when a page supplies one: a shared link to a
 * piece should show the piece, and a route that follows it must put the logo back instead of
 * leaving the previous piece's photograph on an unrelated page.
 */
export function usePageMeta({ title, description, canonicalPath, noindex, image, imageAlt }: PageMeta) {
  useEffect(() => {
    if (title) document.title = title;
    // A page that does not describe itself keeps the site-wide description from index.html.
    setNamedMeta("description", description);
    setNamedMeta("robots", noindex ? "noindex, follow" : INDEXABLE_ROBOTS);
    setPropertyMeta("og:title", title);
    setPropertyMeta("og:description", description);
    setPropertyMeta("og:url", absoluteUrl(canonicalPath));
    setCanonical(absoluteUrl(canonicalPath));
    const imageUrl = new URL(image || DEFAULT_IMAGE_PATH, SITE_ORIGIN ?? window.location.origin).toString();
    const imageText = imageAlt?.trim() || title || DEFAULT_IMAGE_ALT;
    setPropertyMeta("og:image", imageUrl);
    setPropertyMeta("og:image:alt", imageText);
    setNamedMeta("twitter:card", "summary_large_image");
    setNamedMeta("twitter:image", imageUrl);
    setNamedMeta("twitter:image:alt", imageText);
  }, [title, description, canonicalPath, noindex, image, imageAlt]);
}

function absoluteUrl(path?: string): string {
  const target = path ?? `${window.location.pathname}${window.location.search}`;
  return new URL(target, SITE_ORIGIN ?? window.location.origin).toString();
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

function setCanonical(href: string): void {
  const link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?? document.head.appendChild(document.createElement("link"));
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", href);
}

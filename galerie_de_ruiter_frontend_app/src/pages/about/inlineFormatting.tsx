import type { ReactNode } from "react";
import { resolveApiAssetUrl } from "@/apis/apiConfig";

/** Matches `**bold**`, `*italic*` and `![alt](url)` image syntax in one pass. */
const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*|!\[[^\]]*\]\([^)\s]+\))/g;
const IMAGE_PATTERN = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

/**
 * Renders the inline formatting the editor's toolbar produces. Photographs inserted from the
 * toolbar are stored as `![alt](/api/about/images/{id})`, so their path is resolved against
 * the API origin here.
 */
export function inlineFormatting(text: string): ReactNode[] {
  return text.split(INLINE_PATTERN).map((part, index) => {
    const image = IMAGE_PATTERN.exec(part);
    if (image) {
      // Photographs the admin uploads are not measured when they are stored, so the attributes
      // reserve a 4:3 box; `.about-content img` keeps the real size, capped at the column width.
      return <img key={index} className="about-content-image" src={resolveApiAssetUrl(image[2])} alt={image[1]} loading="lazy" width={1200} height={900} />;
    }
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}


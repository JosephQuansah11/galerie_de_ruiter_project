import type { ReactNode } from "react";
import { inlineFormatting } from "./inlineFormatting";

/**
 * Renders the gallery story that the admin edits. It understands the small Markdown subset
 * the editor's toolbar produces: `#`/`##`/`###` headings, `---` dividers, `- ` bullets and
 * `**bold**` / `*italic*` inline. Anything else is a paragraph.
 */
export function renderAboutContent(content: string) {
  const blocks: ReactNode[] = [];
  let bullets: ReactNode[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    blocks.push(<ul key={key}>{bullets}</ul>);
    bullets = [];
  };

  content.split(/\r?\n/).forEach((line, index) => {
    const bullet = /^[-*]\s+(.+)$/.exec(line.trim());
    if (bullet) {
      bullets.push(<li key={`item-${index}`}>{inlineFormatting(bullet[1])}</li>);
      return;
    }
    flushBullets(`list-${index}`);
    if (!line.trim()) return;
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={index} />);
      return;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (!heading) {
      blocks.push(<p key={index}>{inlineFormatting(line)}</p>);
      return;
    }
    const text = inlineFormatting(heading[2]);
    blocks.push(heading[1].length === 1 ? <h1 key={index}>{text}</h1>
      : heading[1].length === 2 ? <h2 key={index}>{text}</h2> : <h3 key={index}>{text}</h3>);
  });
  flushBullets("list-end");
  return blocks;
}


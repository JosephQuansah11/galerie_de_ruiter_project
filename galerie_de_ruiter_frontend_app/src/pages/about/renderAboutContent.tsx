import type { ReactNode } from "react";
import { inlineFormatting } from "./inlineFormatting";

/**
 * Renders the gallery story that the admin edits. It understands the small Markdown subset
 * the editor's toolbar produces: `#`/`##`/`###` headings, `---` dividers, `- ` bullets and
 * `**bold**` / `*italic*` inline. Anything else is a paragraph.
 *
 * The story is written by hand, so its heading levels cannot be trusted: a story that opens
 * with `#` and then jumps to `###` gives a page that skips a level, which is a heading-order
 * failure (and an outline a screen reader cannot follow). The levels are therefore normalised -
 * the first heading becomes the page's `h1`, and no heading is more than one step deeper than
 * the one before it.
 */
export function renderAboutContent(content: string) {
  const blocks: ReactNode[] = [];
  let bullets: ReactNode[] = [];
  let previousLevel = 0;

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    blocks.push(<ul key={key}>{bullets}</ul>);
    bullets = [];
  };

  const levelFor = (written: number) => {
    const level = previousLevel === 0 ? 1 : Math.min(written, previousLevel + 1);
    previousLevel = level;
    return level;
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
    const level = levelFor(heading[1].length);
    blocks.push(level === 1 ? <h1 key={index}>{text}</h1>
      : level === 2 ? <h2 key={index}>{text}</h2> : <h3 key={index}>{text}</h3>);
  });
  flushBullets("list-end");
  return blocks;
}


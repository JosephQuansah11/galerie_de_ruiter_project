/**
 * The text transforms behind the About page formatting toolbar.
 *
 * The gallery story is stored as Markdown and rendered by `renderAboutContent`, so each tool
 * only has to edit plain text: wrap a selection, change a line's heading level, or insert a
 * block. Keeping them as pure functions means the toolbar stays a thin layer over the
 * textarea and the behaviour can be tested without a DOM.
 */

/** The new text plus where the caret should sit afterwards. */
export type FormatResult = { value: string; selectionStart: number; selectionEnd: number };

const HEADING_PATTERN = /^#{1,6}\s+/;
const LIST_PREFIX = "- ";

/** The range of the line(s) that contain the selection. */
function lineRange(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nextBreak = value.indexOf("\n", end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  return { lineStart, lineEnd };
}

/**
 * Wraps the selection in a marker pair (`**` for bold, `*` for italic). Applying it again to
 * already-wrapped text removes the markers, so the button toggles. With no selection the
 * markers are inserted and the caret is left between them.
 */
export function wrapSelection(value: string, start: number, end: number, marker: string): FormatResult {
  const before = value.slice(Math.max(0, start - marker.length), start);
  const after = value.slice(end, end + marker.length);
  if (before === marker && after === marker) {
    return {
      value: value.slice(0, start - marker.length) + value.slice(start, end) + value.slice(end + marker.length),
      selectionStart: start - marker.length,
      selectionEnd: end - marker.length,
    };
  }
  const selected = value.slice(start, end);
  return {
    value: value.slice(0, start) + marker + selected + marker + value.slice(end),
    selectionStart: start + marker.length,
    selectionEnd: end + marker.length,
  };
}

/**
 * Sets the heading level of every line in the selection. An existing heading level is
 * replaced rather than stacked, and pressing the same level again turns the heading back
 * into a paragraph.
 */
export function applyHeading(value: string, start: number, end: number, level: number): FormatResult {
  const marker = `${"#".repeat(level)} `;
  return transformLines(value, start, end, (line) => line.replace(HEADING_PATTERN, ""), marker, (line) => line.startsWith(marker));
}

/** Adds (or removes) a `- ` bullet on every line in the selection. */
export function applyList(value: string, start: number, end: number): FormatResult {
  return transformLines(value, start, end,
    (line) => (line.startsWith(LIST_PREFIX) ? line.slice(LIST_PREFIX.length) : line),
    LIST_PREFIX,
    (line) => line.startsWith(LIST_PREFIX));
}

/**
 * Inserts a block (for example a `---` divider) on its own line at the caret, so it never
 * merges into the paragraph the admin was typing in.
 */
export function insertBlock(value: string, start: number, end: number, block: string): FormatResult {
  const atLineStart = start === 0 || value[start - 1] === "\n";
  const inserted = atLineStart ? `${block}\n` : `\n${block}\n`;
  const caret = start + inserted.length;
  return {
    value: value.slice(0, start) + inserted + value.slice(end),
    selectionStart: caret,
    selectionEnd: caret,
  };
}

/**
 * Applies (or removes) a line prefix across the selected lines. Empty lines are left alone so
 * a blank line between paragraphs does not become a heading or a bullet.
 */
function transformLines(
  value: string,
  start: number,
  end: number,
  strip: (line: string) => string,
  marker: string,
  isMarked: (line: string) => boolean,
): FormatResult {
  const { lineStart, lineEnd } = lineRange(value, start, end);
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const contentLines = lines.filter((line) => line.trim() !== "");
  const allMarked = contentLines.length > 0 && contentLines.every(isMarked);
  const next = lines
    .map((line) => (line.trim() === "" ? line : allMarked ? strip(line) : `${marker}${strip(line)}`))
    .join("\n");
  return {
    value: value.slice(0, lineStart) + next + value.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + next.length,
  };
}

import { useEffect, useRef, useState, type RefObject } from "react";
import { ChevronsDown } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * A shortcut to the last rows of a long list.
 *
 * The button is not tied to the window: the shell scrolls `.main-content`, so the target is the
 * list element and `scrollIntoView` lets the browser move whichever ancestor actually scrolls.
 *
 * A one-pixel sentinel after the list decides whether anything is left below the fold.
 * IntersectionObserver re-evaluates it when the page scrolls and when the content grows, so a list
 * that gains rows after the visitor reached the bottom shows the button again. Re-creating the
 * observer when `itemCount` changes is deliberate: an appended row moves the sentinel even when no
 * scroll event follows the change. A short list never shows the button - it would be a control that
 * does nothing.
 */
type Props = {
  /** The number of rows in the list; the button only appears for a long one. */
  itemCount: number;
  /** The list whose last child is the destination. */
  targetRef: RefObject<HTMLElement | null>;
  /** Below this many rows the shortcut is noise rather than help. */
  minItems?: number;
};

const DEFAULT_MIN_ITEMS = 8;

export function JumpToBottom({ itemCount, targetRef, minItems = DEFAULT_MIN_ITEMS }: Props) {
  const { t } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [belowFold, setBelowFold] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    // jsdom, and a browser without IntersectionObserver, get no shortcut rather than a guess.
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setBelowFold(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [itemCount]);

  const show = itemCount >= minItems && belowFold;

  const jump = () => {
    const target = targetRef.current;
    if (!target) return;
    const last = target.lastElementChild ?? target;
    last.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  return <>
    <div ref={sentinelRef} className="jump-to-bottom-sentinel" aria-hidden="true" />
    {show && <button type="button" className="jump-to-bottom" aria-label={t("jumpToBottomLabel")} onClick={jump}>
      <ChevronsDown size={18} aria-hidden="true" />
      <span>{t("jumpToBottom")}</span>
    </button>}
  </>;
}

import { useEffect, useRef, useState, type RefObject } from "react";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Shortcuts to the top and last rows of a long list.
 *
 * Neither button is tied to the window: the shell scrolls `.main-content`, so the bottom target is
 * the list element and `scrollIntoView` lets the browser move whichever ancestor actually scrolls.
 * The top shortcut appears once that scroller has moved away from the top, and returns to the page
 * section around the list - the heading and filters a visitor wants to check again.
 *
 * A one-pixel sentinel after the list decides whether anything is left below the fold.
 * IntersectionObserver re-evaluates it when the page scrolls and when the content grows, so a list
 * that gains rows after the visitor reached the bottom shows the button again. Re-creating the
 * observer when `itemCount` changes is deliberate: an appended row moves the sentinel even when no
 * scroll event follows the change. A short list never shows either button - they would be controls
 * that do nothing.
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    // jsdom, and a browser without IntersectionObserver, get no shortcut rather than a guess.
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setBelowFold(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [itemCount]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    // The shell, not the window, owns the scroll. A page rendered outside it falls back to the
    // window so the shortcut still answers.
    const scroller = target.closest(".main-content") as HTMLElement | null;
    const read = () => (scroller ? scroller.scrollTop : window.scrollY);
    const update = () => setScrolled(read() > 0);
    update();
    const listenTarget: EventTarget = scroller ?? window;
    listenTarget.addEventListener("scroll", update, { passive: true });
    return () => listenTarget.removeEventListener("scroll", update);
  }, [itemCount, targetRef]);

  const show = itemCount >= minItems;
  const showBottom = show && belowFold;
  const showTop = show && scrolled;

  const jumpToBottom = () => {
    const target = targetRef.current;
    if (!target) return;
    const last = target.lastElementChild ?? target;
    last.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const jumpToTop = () => {
    const target = targetRef.current;
    if (!target) return;
    // The section is the page around the list, so the heading and its controls come back too - not
    // just the first row.
    const page = target.closest("section") ?? target;
    page.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <>
    <div ref={sentinelRef} className="jump-to-bottom-sentinel" aria-hidden="true" />
    {(showTop || showBottom) && <div className="list-jumps">
      {showTop && <button type="button" className="jump-to-top" aria-label={t("jumpToTopLabel")} onClick={jumpToTop}>
        <ChevronsUp size={18} aria-hidden="true" />
        <span>{t("jumpToTop")}</span>
      </button>}
      {showBottom && <button type="button" className="jump-to-bottom" aria-label={t("jumpToBottomLabel")} onClick={jumpToBottom}>
        <ChevronsDown size={18} aria-hidden="true" />
        <span>{t("jumpToBottom")}</span>
      </button>}
    </div>}
  </>;
}

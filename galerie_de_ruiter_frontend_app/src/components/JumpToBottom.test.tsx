import { useRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { JumpToBottom } from "./JumpToBottom";

/** A controllable stand-in for the browser's IntersectionObserver. */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];
  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
  /** Reports where the sentinel sits relative to the viewport. */
  report(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

function Harness({ count, itemCount = count }: { count: number; itemCount?: number }) {
  const listRef = useRef<HTMLDivElement>(null);
  return <>
    <div ref={listRef} className="test-list">
      {Array.from({ length: count }, (_, index) => <p key={index}>Item {index + 1}</p>)}
    </div>
    <JumpToBottom itemCount={itemCount} targetRef={listRef} />
  </>;
}

const renderHarness = (count: number, itemCount?: number) =>
  render(<I18nextProvider i18n={i18n}><Harness count={count} itemCount={itemCount} /></I18nextProvider>);

const latestObserver = () => FakeIntersectionObserver.instances.at(-1)!;
const button = () => screen.queryByRole("button", { name: i18n.t("jumpToBottomLabel") });

let originalObserver: typeof IntersectionObserver | undefined;
let originalElementScroll: typeof Element.prototype.scrollIntoView;
let originalHtmlScroll: typeof HTMLElement.prototype.scrollIntoView;
let scroll: jest.Mock;

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  originalObserver = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  // jsdom defines its own `scrollIntoView` on HTMLElement.prototype, which shadows the Element
  // one; both are replaced with the same mock so the call is observable either way.
  originalElementScroll = Element.prototype.scrollIntoView;
  originalHtmlScroll = HTMLElement.prototype.scrollIntoView;
  scroll = jest.fn();
  Element.prototype.scrollIntoView = scroll;
  HTMLElement.prototype.scrollIntoView = scroll;
});

afterEach(() => {
  globalThis.IntersectionObserver = originalObserver as typeof IntersectionObserver;
  Element.prototype.scrollIntoView = originalElementScroll;
  HTMLElement.prototype.scrollIntoView = originalHtmlScroll;
});

describe("the shortcut to the last items", () => {
  it("stays away from a list that is short enough to read", () => {
    renderHarness(3);

    act(() => latestObserver().report(false));

    expect(button()).toBeNull();
  });

  it("appears while the last rows are below the fold, and leaves once they are visible", () => {
    renderHarness(12);
    expect(button()).toBeNull();

    act(() => latestObserver().report(false));
    expect(button()).toBeInTheDocument();

    act(() => latestObserver().report(true));
    expect(button()).toBeNull();
  });

  it("brings the last row of the list into view", () => {
    renderHarness(12);
    act(() => latestObserver().report(false));

    fireEvent.click(button()!);

    expect(scroll).toHaveBeenCalledWith({ behavior: "smooth", block: "end" });
    // The destination is the last row, not the page footer or the top of the list.
    expect(scroll.mock.instances[0]).toBe(document.querySelector(".test-list")!.lastElementChild);
  });

  it("comes back when more rows are added to a list that was already read to the bottom", () => {
    const view = renderHarness(12);
    act(() => latestObserver().report(true));
    expect(button()).toBeNull();

    view.rerender(<I18nextProvider i18n={i18n}><Harness count={20} /></I18nextProvider>);
    act(() => latestObserver().report(false));

    expect(FakeIntersectionObserver.instances.length).toBeGreaterThan(1);
    expect(button()).toBeInTheDocument();
  });
});

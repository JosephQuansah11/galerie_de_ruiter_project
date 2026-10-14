import { render, screen } from "@testing-library/react";
import { renderAboutContent } from "./renderAboutContent";

describe("renderAboutContent", () => {
  it("renders headings, dividers and inline emphasis", () => {
    render(<div>{renderAboutContent("# Story\n\nA **bold** and *italic* line.\n\n---")}</div>);

    expect(screen.getByRole("heading", { level: 1, name: "Story" })).toBeInTheDocument();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(document.querySelector("hr")).not.toBeNull();
  });

  it("groups bullet lines into a list and keeps the paragraphs around them", () => {
    render(<div>{renderAboutContent("- Mirrors\n- Lamps\n\nA paragraph.")}</div>);

    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Mirrors", "Lamps"]);
    expect(screen.getByText("A paragraph.")).toBeInTheDocument();
  });

  it("keeps the heading order a screen reader can follow", () => {
    // The gallery writes the story by hand; this is the shape of the live content.
    render(<div>{renderAboutContent("# Story\n\n### A chapter\n\n## Another\n\n### Deep")}</div>);

    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName.slice(1)));
    expect(levels).toEqual([1, 2, 2, 3]);
  });

  it("gives a story that opens with a deeper heading a page title", () => {
    render(<div>{renderAboutContent("## Two\n### Three")}</div>);

    expect(screen.getByRole("heading", { level: 1, name: "Two" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Three" })).toBeInTheDocument();
  });

  it("renders an inserted photograph against the API origin", () => {
    render(<div>{renderAboutContent("![Our pop-up](/api/about/images/7)")}</div>);

    expect(screen.getByRole("img", { name: "Our pop-up" })).toHaveAttribute("src", "http://api.test/api/about/images/7");
  });
});

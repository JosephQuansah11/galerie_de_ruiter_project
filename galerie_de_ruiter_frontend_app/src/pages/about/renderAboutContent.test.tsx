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

  it("renders the second and third heading levels", () => {
    render(<div>{renderAboutContent("## Two\n### Three")}</div>);

    expect(screen.getByRole("heading", { level: 2, name: "Two" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Three" })).toBeInTheDocument();
  });
});

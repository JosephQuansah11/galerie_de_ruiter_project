import { applyHeading, applyList, insertBlock, wrapSelection } from "./formatActions";

describe("wrapSelection", () => {
  it("wraps the selection and keeps it selected", () => {
    expect(wrapSelection("Hello world", 0, 5, "**")).toEqual({ value: "**Hello** world", selectionStart: 2, selectionEnd: 7 });
  });

  it("inserts the markers with the caret between them when nothing is selected", () => {
    expect(wrapSelection("Hello", 5, 5, "*")).toEqual({ value: "Hello**", selectionStart: 6, selectionEnd: 6 });
  });

  it("removes the markers when the same tool is applied again", () => {
    expect(wrapSelection("**Hello** world", 2, 7, "**")).toEqual({ value: "Hello world", selectionStart: 0, selectionEnd: 5 });
  });
});

describe("applyHeading", () => {
  it("turns the caret's line into a heading", () => {
    expect(applyHeading("Gallery story", 3, 3, 1).value).toBe("# Gallery story");
  });

  it("replaces an existing heading level instead of stacking markers", () => {
    expect(applyHeading("## Gallery story", 0, 3, 1).value).toBe("# Gallery story");
  });

  it("removes the heading when the same level is applied again", () => {
    expect(applyHeading("# Gallery story", 0, 3, 1).value).toBe("Gallery story");
  });

  it("applies to every selected line", () => {
    expect(applyHeading("One\nTwo", 0, 7, 2).value).toBe("## One\n## Two");
  });
});

describe("applyList", () => {
  it("adds a bullet to every selected line", () => {
    expect(applyList("One\nTwo", 0, 7).value).toBe("- One\n- Two");
  });

  it("removes the bullets again", () => {
    expect(applyList("- One\n- Two", 0, 11).value).toBe("One\nTwo");
  });

  it("leaves blank lines alone", () => {
    expect(applyList("One\n\nTwo", 0, 8).value).toBe("- One\n\n- Two");
  });
});

describe("insertBlock", () => {
  it("puts a divider on its own line at the caret", () => {
    expect(insertBlock("Story", 5, 5, "---").value).toBe("Story\n---\n");
  });

  it("does not add a leading break at the start of a line", () => {
    expect(insertBlock("Story", 0, 0, "---").value).toBe("---\nStory");
  });
});

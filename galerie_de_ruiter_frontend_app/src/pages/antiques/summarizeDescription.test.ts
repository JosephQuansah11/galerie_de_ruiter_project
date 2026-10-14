import { DESCRIPTION_PREVIEW_MAX_WORDS, summarizeDescription } from "./summarizeDescription";

describe("summarizeDescription", () => {
  it("returns an empty string when there is no description", () => {
    expect(summarizeDescription(undefined)).toBe("");
    expect(summarizeDescription(null)).toBe("");
    expect(summarizeDescription("   ")).toBe("");
  });

  it("keeps a description that is already short", () => {
    expect(summarizeDescription("Late 19th century walnut mirror")).toBe("Late 19th century walnut mirror");
  });

  it("collapses newlines and extra spaces into one line", () => {
    expect(summarizeDescription("A mirror\nwith   a story")).toBe("A mirror with a story");
  });

  it("trims a long description to the preview length", () => {
    const words = Array.from({ length: 80 }, (_, index) => `word${index + 1}`);
    const summary = summarizeDescription(words.join(" "));

    expect(summary.endsWith("…")).toBe(true);
    expect(summary.replace("…", "").split(" ")).toHaveLength(DESCRIPTION_PREVIEW_MAX_WORDS);
    expect(summary).toContain("word50");
    expect(summary).not.toContain("word51");
  });
});

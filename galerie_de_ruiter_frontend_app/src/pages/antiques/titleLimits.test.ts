import { ANTIQUE_TITLE_MAX_WORDS, titleIsTooLong, titleWordCount } from "./titleLimits";

describe("the title allowance", () => {
  it("counts whitespace-separated words", () => {
    expect(titleWordCount("  Carved\nwalnut\tmirror  ")).toBe(3);
    expect(titleWordCount("")).toBe(0);
    expect(titleWordCount(undefined)).toBe(0);
  });

  it("allows exactly ten words and rejects the next one", () => {
    const atLimit = Array(ANTIQUE_TITLE_MAX_WORDS).fill("word").join(" ");

    expect(titleIsTooLong(atLimit)).toBe(false);
    expect(titleIsTooLong(`${atLimit} word`)).toBe(true);
  });
});

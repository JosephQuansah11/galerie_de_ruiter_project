import {
  ANTIQUE_DESCRIPTION_MAX_WORDS,
  descriptionIsTooLong,
  descriptionWordCount,
} from "./descriptionLimits";

describe("the description allowance", () => {
  it("counts whitespace-separated words", () => {
    expect(descriptionWordCount("  A carved\nwalnut\tmirror  ")).toBe(4);
    expect(descriptionWordCount("")).toBe(0);
    expect(descriptionWordCount(undefined)).toBe(0);
  });

  it("allows exactly 5000 words and rejects the next one", () => {
    const atLimit = Array(ANTIQUE_DESCRIPTION_MAX_WORDS).fill("word").join(" ");

    expect(descriptionIsTooLong(atLimit)).toBe(false);
    expect(descriptionIsTooLong(`${atLimit} word`)).toBe(true);
  });
});

import i18n from "@/i18n";
import { themeTranslationKeys, themes } from "./themes";

/**
 * The palettes the preferences screen offers.
 *
 * A theme is ten colours that `applyTheme` writes onto the document as `--theme-*` variables, and
 * that is all a stylesheet ever reads - so a palette with a colour missing, or a name no language
 * translates, is a page with a hole in it or a raw key where a label belongs. Both are cheap to
 * catch here and slow to notice in a browser.
 */
const colourKeys = ["background", "surface", "text", "textSecondary", "primary", "onPrimary", "accent", "border", "navStart", "navEnd"];
const languages = ["en", "fr", "nl-BE", "nl-NL", "de"];

describe("the gallery themes", () => {
  it("gives every theme the ten colours the stylesheets read", () => {
    expect(Object.keys(themes).length).toBeGreaterThanOrEqual(8);
    for (const [id, theme] of Object.entries(themes)) {
      expect({ id, keys: Object.keys(theme.colors).sort() }).toEqual({ id, keys: [...colourKeys].sort() });
      for (const [name, value] of Object.entries(theme.colors)) {
        expect({ id, name, hex: /^#[0-9a-f]{6}$/i.test(value) }).toEqual({ id, name, hex: true });
      }
    }
  });

  it("names each theme after the key it is stored under", () => {
    for (const [id, theme] of Object.entries(themes)) expect(theme.id).toBe(id);
  });

  it("gives every palette a dark form and a light form", () => {
    // The gallery's rule: a palette is offered in both modes, so the switch has somewhere to go.
    const light = Object.values(themes).filter((theme) => !theme.isDark);
    const dark = Object.values(themes).filter((theme) => theme.isDark);
    expect(light.length).toBeGreaterThan(0);
    expect(dark).toHaveLength(light.length);
    for (const theme of Object.values(themes)) {
      const counterpart = themes[theme.counterpart];
      expect({ id: theme.id, counterpart: counterpart?.id }).toEqual({ id: theme.id, counterpart: theme.counterpart });
      // The other mode, naming this one back: the light/dark switch moves along this pair.
      expect({ id: theme.id, otherMode: counterpart.isDark === !theme.isDark }).toEqual({ id: theme.id, otherMode: true });
      expect({ id: theme.id, mutual: counterpart.counterpart === theme.id }).toEqual({ id: theme.id, mutual: true });
    }
  });

  it("gives every theme a label in every language", () => {
    for (const id of Object.keys(themes)) {
      const key = themeTranslationKeys[id];
      expect({ id, hasKey: typeof key === "string" }).toEqual({ id, hasKey: true });
      for (const language of languages) {
        const label = i18n.getFixedT(language)(key);
        // A key no language translates comes back as itself, which is what the visitor would read.
        expect({ id, language, labelled: label !== key && label.length > 0 }).toEqual({ id, language, labelled: true });
      }
    }
  });
});

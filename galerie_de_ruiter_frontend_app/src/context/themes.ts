export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  colors: Record<"background" | "surface" | "text" | "textSecondary" | "primary" | "onPrimary" | "accent" | "border" | "navStart" | "navEnd", string>;
}

/**
 * The label a theme is offered under on the preferences screen. It lives beside the palettes rather
 * than in the page so that `src/context/themes.test.ts` can hold the two together: a theme without a
 * label, or a label missing from one of the five languages, shows the visitor a raw key.
 */
export const themeTranslationKeys: Record<string, string> = {
  default: "themeWineWhite",
  dark: "themeDeepWine",
  ocean: "themeRosePaper",
  forest: "themeOxblood",
  sunset: "themeBlush",
  grey: "themeGreyWhite",
  blueGold: "themeBlueGold",
  earth: "themeEarthGrey",
};

/**
 * The gallery's palettes. `applyTheme` writes all ten colours onto the document as `--theme-*`
 * variables, which is what the stylesheets read, so a theme is only ever this list - and `isDark`
 * is what adds the `theme-dark` class the dark rules hang off. The order here is the order the
 * picker offers them in.
 */
export const themes: Record<string, Theme> = {
  default: { id: "default", name: "Wine & white", isDark: false, colors: { background: "#f6f1ed", surface: "#fffdfb", text: "#352629", textSecondary: "#705c60", primary: "#841a23", onPrimary: "#fffaf7", accent: "#c7a873", border: "#dfd1ca", navStart: "#54121b", navEnd: "#841a23" } },
  dark: { id: "dark", name: "Deep wine", isDark: true, colors: { background: "#26171a", surface: "#392428", text: "#fff8f4", textSecondary: "#d8c2bf", primary: "#cf8b91", onPrimary: "#201416", accent: "#dfbf84", border: "#62464a", navStart: "#351016", navEnd: "#741c27" } },
  ocean: { id: "ocean", name: "Rose paper", isDark: false, colors: { background: "#eee7e3", surface: "#fffdfb", text: "#302729", textSecondary: "#69595b", primary: "#75434b", onPrimary: "#fffaf7", accent: "#ba9872", border: "#d9cbc5", navStart: "#51313b", navEnd: "#87444e" } },
  forest: { id: "forest", name: "Oxblood", isDark: false, colors: { background: "#eeeee8", surface: "#fffefa", text: "#292c26", textSecondary: "#62645a", primary: "#743b40", onPrimary: "#fffaf7", accent: "#b59a6a", border: "#d5d6cb", navStart: "#303a32", navEnd: "#743b40" } },
  sunset: { id: "sunset", name: "Blush", isDark: false, colors: { background: "#f3e9e4", surface: "#fffaf7", text: "#382728", textSecondary: "#765e5d", primary: "#8b3e3e", onPrimary: "#fffaf7", accent: "#c39a71", border: "#e0cec6", navStart: "#672630", navEnd: "#984b45" } },
  grey: { id: "grey", name: "Grey & white", isDark: false, colors: { background: "#f2f2f3", surface: "#ffffff", text: "#2c2f33", textSecondary: "#5c6166", primary: "#4a4f54", onPrimary: "#ffffff", accent: "#a9a29a", border: "#dcdde0", navStart: "#33373b", navEnd: "#565b60" } },
  blueGold: { id: "blueGold", name: "Blue & gold", isDark: false, colors: { background: "#eef1f5", surface: "#ffffff", text: "#222a35", textSecondary: "#57616f", primary: "#2f4a6d", onPrimary: "#f7f9fc", accent: "#c2a45f", border: "#d5dce5", navStart: "#1f3450", navEnd: "#3a5a80" } },
  earth: { id: "earth", name: "Earth & grey", isDark: false, colors: { background: "#efece7", surface: "#fdfbf8", text: "#33302a", textSecondary: "#6a6357", primary: "#6b5644", onPrimary: "#fdfaf6", accent: "#9c9488", border: "#d9d3c9", navStart: "#4a3f33", navEnd: "#6b5644" } },
};


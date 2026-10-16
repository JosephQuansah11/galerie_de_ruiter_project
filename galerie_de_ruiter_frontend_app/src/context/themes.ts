export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  /**
   * The id of this palette in the other mode. Every theme has one, and it is what the light/dark
   * switch moves along: a visitor reading Blue & gold who asks for the dark interface gets the dark
   * form of Blue & gold, not a different palette, and asking for light brings the pair back.
   */
  counterpart: string;
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
  oceanDark: "themeRoseInk",
  forest: "themeOxblood",
  forestDark: "themeOxbloodNight",
  sunset: "themeBlush",
  sunsetDark: "themeBlushNight",
  grey: "themeGreyWhite",
  greyDark: "themeGraphite",
  blueGold: "themeBlueGold",
  blueGoldDark: "themeMidnightGold",
  earth: "themeEarthGrey",
  earthDark: "themeDeepEarth",
};

/**
 * The gallery's palettes, light and dark. `applyTheme` writes all ten colours onto the document as
 * `--theme-*` variables, which is what the stylesheets read, so a theme is only ever this list - and
 * `isDark` is what adds the `theme-dark` class the dark rules hang off, which is the whole of what a
 * dark palette needs. Every palette is offered in both modes, so the list is read in pairs: the light
 * form, then the dark form of the same palette under it. The order here is the order the picker
 * offers them in.
 */
export const themes: Record<string, Theme> = {
  default: { id: "default", name: "Wine & white", isDark: false, counterpart: "dark", colors: { background: "#f6f1ed", surface: "#fffdfb", text: "#352629", textSecondary: "#705c60", primary: "#841a23", onPrimary: "#fffaf7", accent: "#c7a873", border: "#dfd1ca", navStart: "#54121b", navEnd: "#841a23" } },
  dark: { id: "dark", name: "Deep wine", isDark: true, counterpart: "default", colors: { background: "#26171a", surface: "#392428", text: "#fff8f4", textSecondary: "#d8c2bf", primary: "#cf8b91", onPrimary: "#201416", accent: "#dfbf84", border: "#62464a", navStart: "#351016", navEnd: "#741c27" } },
  ocean: { id: "ocean", name: "Rose paper", isDark: false, counterpart: "oceanDark", colors: { background: "#eee7e3", surface: "#fffdfb", text: "#302729", textSecondary: "#69595b", primary: "#75434b", onPrimary: "#fffaf7", accent: "#ba9872", border: "#d9cbc5", navStart: "#51313b", navEnd: "#87444e" } },
  oceanDark: { id: "oceanDark", name: "Rose ink", isDark: true, counterpart: "ocean", colors: { background: "#231a1d", surface: "#332528", text: "#fdf6f4", textSecondary: "#d3bcbb", primary: "#cf9aa2", onPrimary: "#1e1416", accent: "#d8b98f", border: "#5b4347", navStart: "#2f1e23", navEnd: "#5f3239" } },
  forest: { id: "forest", name: "Oxblood", isDark: false, counterpart: "forestDark", colors: { background: "#eeeee8", surface: "#fffefa", text: "#292c26", textSecondary: "#62645a", primary: "#743b40", onPrimary: "#fffaf7", accent: "#b59a6a", border: "#d5d6cb", navStart: "#303a32", navEnd: "#743b40" } },
  forestDark: { id: "forestDark", name: "Oxblood night", isDark: true, counterpart: "forest", colors: { background: "#1f2320", surface: "#2c322c", text: "#f6f8f2", textSecondary: "#c3c8b9", primary: "#c08a8e", onPrimary: "#1b1a18", accent: "#cbb28a", border: "#4d544a", navStart: "#252c26", navEnd: "#4f3236" } },
  sunset: { id: "sunset", name: "Blush", isDark: false, counterpart: "sunsetDark", colors: { background: "#f3e9e4", surface: "#fffaf7", text: "#382728", textSecondary: "#765e5d", primary: "#8b3e3e", onPrimary: "#fffaf7", accent: "#c39a71", border: "#e0cec6", navStart: "#672630", navEnd: "#984b45" } },
  sunsetDark: { id: "sunsetDark", name: "Blush night", isDark: true, counterpart: "sunset", colors: { background: "#251a19", surface: "#352423", text: "#fdf5f1", textSecondary: "#dcc2ba", primary: "#d09a95", onPrimary: "#221414", accent: "#d8b184", border: "#5f4340", navStart: "#331d1c", navEnd: "#6a3a34" } },
  grey: { id: "grey", name: "Grey & white", isDark: false, counterpart: "greyDark", colors: { background: "#f2f2f3", surface: "#ffffff", text: "#2c2f33", textSecondary: "#5c6166", primary: "#4a4f54", onPrimary: "#ffffff", accent: "#a9a29a", border: "#dcdde0", navStart: "#33373b", navEnd: "#565b60" } },
  greyDark: { id: "greyDark", name: "Graphite", isDark: true, counterpart: "grey", colors: { background: "#1f2022", surface: "#2b2d30", text: "#f6f7f8", textSecondary: "#b9bec3", primary: "#a8adb3", onPrimary: "#1c1d1f", accent: "#c3bcb2", border: "#45484c", navStart: "#26282a", navEnd: "#42464a" } },
  blueGold: { id: "blueGold", name: "Blue & gold", isDark: false, counterpart: "blueGoldDark", colors: { background: "#eef1f5", surface: "#ffffff", text: "#222a35", textSecondary: "#57616f", primary: "#2f4a6d", onPrimary: "#f7f9fc", accent: "#c2a45f", border: "#d5dce5", navStart: "#1f3450", navEnd: "#3a5a80" } },
  blueGoldDark: { id: "blueGoldDark", name: "Midnight gold", isDark: true, counterpart: "blueGold", colors: { background: "#161c24", surface: "#1f2731", text: "#f2f6fa", textSecondary: "#b3c0cd", primary: "#8fb0d6", onPrimary: "#141a22", accent: "#d8b96a", border: "#3b4757", navStart: "#1b2531", navEnd: "#2f4666" } },
  earth: { id: "earth", name: "Earth & grey", isDark: false, counterpart: "earthDark", colors: { background: "#efece7", surface: "#fdfbf8", text: "#33302a", textSecondary: "#6a6357", primary: "#6b5644", onPrimary: "#fdfaf6", accent: "#9c9488", border: "#d9d3c9", navStart: "#4a3f33", navEnd: "#6b5644" } },
  earthDark: { id: "earthDark", name: "Deep earth", isDark: true, counterpart: "earth", colors: { background: "#211d18", surface: "#2d2822", text: "#f8f4ee", textSecondary: "#c8bfb1", primary: "#c3a98c", onPrimary: "#1d1915", accent: "#cbb79b", border: "#4f463c", navStart: "#2a241d", navEnd: "#4c3d2e" } },
};


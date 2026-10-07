export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  colors: Record<"background" | "surface" | "text" | "textSecondary" | "primary" | "onPrimary" | "accent" | "border" | "navStart" | "navEnd", string>;
}

export const themes: Record<string, Theme> = {
  default: { id: "default", name: "Wine & white", isDark: false, colors: { background: "#f6f1ed", surface: "#fffdfb", text: "#352629", textSecondary: "#705c60", primary: "#841a23", onPrimary: "#fffaf7", accent: "#c7a873", border: "#dfd1ca", navStart: "#54121b", navEnd: "#841a23" } },
  dark: { id: "dark", name: "Deep wine", isDark: true, colors: { background: "#26171a", surface: "#392428", text: "#fff8f4", textSecondary: "#d8c2bf", primary: "#cf8b91", onPrimary: "#201416", accent: "#dfbf84", border: "#62464a", navStart: "#351016", navEnd: "#741c27" } },
  ocean: { id: "ocean", name: "Rose paper", isDark: false, colors: { background: "#eee7e3", surface: "#fffdfb", text: "#302729", textSecondary: "#69595b", primary: "#75434b", onPrimary: "#fffaf7", accent: "#ba9872", border: "#d9cbc5", navStart: "#51313b", navEnd: "#87444e" } },
  forest: { id: "forest", name: "Oxblood", isDark: false, colors: { background: "#eeeee8", surface: "#fffefa", text: "#292c26", textSecondary: "#62645a", primary: "#743b40", onPrimary: "#fffaf7", accent: "#b59a6a", border: "#d5d6cb", navStart: "#303a32", navEnd: "#743b40" } },
  sunset: { id: "sunset", name: "Blush", isDark: false, colors: { background: "#f3e9e4", surface: "#fffaf7", text: "#382728", textSecondary: "#765e5d", primary: "#8b3e3e", onPrimary: "#fffaf7", accent: "#c39a71", border: "#e0cec6", navStart: "#672630", navEnd: "#984b45" } },
};

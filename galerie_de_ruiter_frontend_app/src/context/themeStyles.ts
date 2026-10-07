import type { Theme } from "./themes";

export function applyTheme(theme: Theme) {
  localStorage.setItem("selectedTheme", theme.id);
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => root.style.setProperty(`--theme-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`, value));
  const rgb = [0, 2, 4].map((offset) => Number.parseInt(theme.colors.primary.slice(1 + offset, 3 + offset), 16)).join(", ");
  root.style.setProperty("--bs-primary", theme.colors.primary);
  root.style.setProperty("--bs-primary-rgb", rgb);
  ["link-color", "link-hover-color"].forEach((name) => root.style.setProperty(`--bs-${name}`, theme.colors.primary));
  ["link-color-rgb", "link-hover-color-rgb"].forEach((name) => root.style.setProperty(`--bs-${name}`, rgb));
  document.body.classList.toggle("theme-dark", theme.isDark);
}

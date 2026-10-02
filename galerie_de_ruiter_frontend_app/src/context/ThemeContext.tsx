import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface Theme {
  id: string
  name: string
  isDark: boolean
  colors: {
    background: string
    surface: string
    text: string
    textSecondary: string
    primary: string
    onPrimary: string
    accent: string
    border: string
    navStart: string
    navEnd: string
  }
}

export const themes: Record<string, Theme> = {
  default: { id: 'default', name: 'Wine & white', isDark: false, colors: { background: '#f6f1ed', surface: '#fffdfb', text: '#352629', textSecondary: '#705c60', primary: '#841a23', onPrimary: '#fffaf7', accent: '#c7a873', border: '#dfd1ca', navStart: '#54121b', navEnd: '#841a23' } },
  dark: { id: 'dark', name: 'Deep wine', isDark: true, colors: { background: '#26171a', surface: '#392428', text: '#fff8f4', textSecondary: '#d8c2bf', primary: '#cf8b91', onPrimary: '#201416', accent: '#dfbf84', border: '#62464a', navStart: '#351016', navEnd: '#741c27' } },
  ocean: { id: 'ocean', name: 'Rose paper', isDark: false, colors: { background: '#eee7e3', surface: '#fffdfb', text: '#302729', textSecondary: '#69595b', primary: '#75434b', onPrimary: '#fffaf7', accent: '#ba9872', border: '#d9cbc5', navStart: '#51313b', navEnd: '#87444e' } },
  forest: { id: 'forest', name: 'Oxblood', isDark: false, colors: { background: '#eeeee8', surface: '#fffefa', text: '#292c26', textSecondary: '#62645a', primary: '#743b40', onPrimary: '#fffaf7', accent: '#b59a6a', border: '#d5d6cb', navStart: '#303a32', navEnd: '#743b40' } },
  sunset: { id: 'sunset', name: 'Blush', isDark: false, colors: { background: '#f3e9e4', surface: '#fffaf7', text: '#382728', textSecondary: '#765e5d', primary: '#8b3e3e', onPrimary: '#fffaf7', accent: '#c39a71', border: '#e0cec6', navStart: '#672630', navEnd: '#984b45' } },
}

interface ThemeContextValue {
  theme: Theme
  availableThemes: Theme[]
  setTheme: (themeId: string) => void
  toggleDarkMode: () => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('selectedTheme') ?? 'default')
  const theme = themes[themeId] ?? themes.default

  useEffect(() => {
    localStorage.setItem('selectedTheme', theme.id)
    const root = document.documentElement
    root.style.setProperty('--theme-background', theme.colors.background)
    root.style.setProperty('--theme-surface', theme.colors.surface)
    root.style.setProperty('--theme-text', theme.colors.text)
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--theme-primary', theme.colors.primary)
    root.style.setProperty('--theme-on-primary', theme.colors.onPrimary)
    root.style.setProperty('--theme-accent', theme.colors.accent)
    root.style.setProperty('--theme-border', theme.colors.border)
    root.style.setProperty('--theme-nav-start', theme.colors.navStart)
    root.style.setProperty('--theme-nav-end', theme.colors.navEnd)
    const primaryHex = theme.colors.primary.slice(1)
    const primaryRgb = [0, 2, 4]
      .map((offset) => Number.parseInt(primaryHex.slice(offset, offset + 2), 16))
      .join(', ')
    root.style.setProperty('--bs-primary', theme.colors.primary)
    root.style.setProperty('--bs-primary-rgb', primaryRgb)
    root.style.setProperty('--bs-link-color', theme.colors.primary)
    root.style.setProperty('--bs-link-color-rgb', primaryRgb)
    root.style.setProperty('--bs-link-hover-color', theme.colors.primary)
    root.style.setProperty('--bs-link-hover-color-rgb', primaryRgb)
    document.body.classList.toggle('theme-dark', theme.isDark)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    availableThemes: Object.values(themes),
    setTheme: (nextThemeId: string) => { if (themes[nextThemeId]) setThemeId(nextThemeId) },
    toggleDarkMode: () => setThemeId(theme.isDark ? 'default' : 'dark'),
    resetTheme: () => setThemeId('default'),
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

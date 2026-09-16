import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface Theme {
  id: string
  name: string
  isDark: boolean
  colors: { background: string; surface: string; text: string; textSecondary: string; primary: string }
}

export const themes: Record<string, Theme> = {
  default: { id: 'default', name: 'Wine & white', isDark: false, colors: { background: '#f7f1ed', surface: '#ffffff', text: '#3c1f25', textSecondary: '#80656a', primary: '#6b2432' } },
  dark: { id: 'dark', name: 'Deep wine', isDark: true, colors: { background: '#2d171d', surface: '#43242c', text: '#fffaf7', textSecondary: '#ddc3c0', primary: '#d49a9c' } },
  ocean: { id: 'ocean', name: 'Rose paper', isDark: false, colors: { background: '#f1e6e2', surface: '#ffffff', text: '#3c1f25', textSecondary: '#80656a', primary: '#7d3f43' } },
  forest: { id: 'forest', name: 'Oxblood', isDark: false, colors: { background: '#fffaf7', surface: '#ffffff', text: '#3c1f25', textSecondary: '#80656a', primary: '#6b2432' } },
  sunset: { id: 'sunset', name: 'Blush', isDark: false, colors: { background: '#f7ebe7', surface: '#ffffff', text: '#3c1f25', textSecondary: '#80656a', primary: '#8a6258' } },
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

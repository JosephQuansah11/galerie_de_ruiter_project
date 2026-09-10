import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface Theme {
  id: string
  name: string
  isDark: boolean
  colors: { background: string; surface: string; text: string; textSecondary: string; primary: string }
}

export const themes: Record<string, Theme> = {
  default: { id: 'default', name: 'SDA Default', isDark: false, colors: { background: '#f5f6f2', surface: '#ffffff', text: '#26313d', textSecondary: '#78838c', primary: '#1e6f5c' } },
  dark: { id: 'dark', name: 'Dark Mode', isDark: true, colors: { background: '#172329', surface: '#24343a', text: '#f4f7f3', textSecondary: '#b5c4c0', primary: '#78c6a3' } },
  ocean: { id: 'ocean', name: 'Ocean Blue', isDark: false, colors: { background: '#eef7f8', surface: '#ffffff', text: '#173c4b', textSecondary: '#5d7a83', primary: '#087f8c' } },
  forest: { id: 'forest', name: 'Forest Green', isDark: false, colors: { background: '#f0f6f0', surface: '#ffffff', text: '#1e4032', textSecondary: '#6c8577', primary: '#2f7d58' } },
  sunset: { id: 'sunset', name: 'Sunset Orange', isDark: false, colors: { background: '#fff5ed', surface: '#ffffff', text: '#4e3025', textSecondary: '#92766a', primary: '#c65e32' } },
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

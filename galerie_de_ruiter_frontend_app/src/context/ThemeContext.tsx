import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { themes, type Theme } from './themes'
import { applyTheme } from './themeStyles'
export { themes } from './themes'
export type { Theme } from './themes'

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
    applyTheme(theme)
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

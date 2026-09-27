import { Check, Moon, RotateCcw, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { languages, useLanguage } from '../../context/LanguageContext'

export function PreferencesPage() {
  const { theme, availableThemes, setTheme, toggleDarkMode, resetTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  return <div className="page settings-page">
      <section className="page-heading">
          <div>
          <div className="eyebrow">YOUR GALERIE</div>
          <h1>Preferences</h1>
          <p>Set a quiet, personal atmosphere for browsing the collection.</p>
          </div>
          <button className="quiet-button" onClick={resetTheme}>
          <RotateCcw size={16} />Reset</button>
      </section>
      <section className="preference-panel">
      <div className="language-setting">
      <div>
      <div className="eyebrow">LANGUAGE</div>
      <label htmlFor="language-select">Choose your reading language</label>
      </div>
      <select id="language-select" value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}>{languages.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></div><div className="preference-heading"><div><div className="eyebrow">APPEARANCE</div><h2>Set the mood</h2><p>Your selection is remembered on this device.</p></div><button className="quiet-button" onClick={toggleDarkMode}>{theme.isDark ? <Sun size={16} /> : <Moon size={16} />}{theme.isDark ? 'Light mode' : 'Dark mode'}</button></div><div className="theme-grid">{availableThemes.map((option) => <button className={`theme-option ${theme.id === option.id ? 'selected' : ''}`} key={option.id} onClick={() => setTheme(option.id)}><span className="theme-swatch" style={{ background: option.colors.background, borderColor: option.colors.primary }}><span style={{ background: option.colors.primary }} /></span><span><strong>{option.name}</strong><small>{option.isDark ? 'Dark interface' : 'Light interface'}</small></span>{theme.id === option.id && <Check size={18} />}</button>)}</div></section></div>
}

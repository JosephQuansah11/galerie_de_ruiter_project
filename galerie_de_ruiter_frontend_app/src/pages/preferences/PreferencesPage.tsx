import { Button } from "@/components/ReactButton";
import { Check, Languages, Moon, RotateCcw, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { languages, useLanguage } from '../../context/LanguageContext'
import { useTranslation } from 'react-i18next'

const themeTranslationKeys: Record<string, string> = {
  default: 'themeWineWhite',
  dark: 'themeDeepWine',
  ocean: 'themeRosePaper',
  forest: 'themeOxblood',
  sunset: 'themeBlush',
}

export function PreferencesPage() {
  const { t } = useTranslation()
  const { theme, availableThemes, setTheme, toggleDarkMode, resetTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  return <div className="page settings-page">
    <section className="page-heading">
      <div>
        <div className="eyebrow">{t("yourGalerie")}</div>
        <h1>{t("preferencesTitle")}</h1>
        <p>{t("preferencesIntro")}</p>
      </div>
      <Button className="quiet-button" onClick={resetTheme}><RotateCcw size={16} />{t("reset")}</Button>
    </section>

    <section className="settings-card">
      <div className="settings-card-head">
        <div className="settings-card-title">
          <div className="eyebrow">{t("language")}</div>
          <label htmlFor="language-select">{t("chooseReadingLanguage")}</label>
        </div>
        <span className="settings-card-icon" aria-hidden="true"><Languages size={20} /></span>
      </div>
      <div className="language-row">
        <select id="language-select" value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}>
          {languages.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
        </select>
      </div>
    </section>

    <section className="settings-card">
      <div className="settings-card-head">
        <div className="settings-card-title">
          <div className="eyebrow">{t("appearance")}</div>
          <h2>{t("setTheMood")}</h2>
          <p>{t("selectionRemembered")}</p>
        </div>
        <Button className="quiet-button" onClick={toggleDarkMode}>
          {theme.isDark ? <Sun size={16} /> : <Moon size={16} />}
          {theme.isDark ? t("lightMode") : t("darkMode")}
        </Button>
      </div>
      <div className="theme-grid">
        {availableThemes.map((option) => <button
          type="button"
          key={option.id}
          className={`theme-option ${theme.id === option.id ? 'selected' : ''}`}
          aria-pressed={theme.id === option.id}
          onClick={() => setTheme(option.id)}
        >
          <span className="theme-swatch" style={{ background: option.colors.background, borderColor: option.colors.border }}>
            <span className="theme-swatch-dots" aria-hidden="true">
              <span style={{ background: option.colors.primary }} />
              <span style={{ background: option.colors.accent }} />
              <span style={{ background: option.colors.navEnd }} />
            </span>
          </span>
          <span className="theme-copy">
            <strong>{t(themeTranslationKeys[option.id])}</strong>
            <small>{option.isDark ? t("darkInterface") : t("lightInterface")}</small>
          </span>
          {theme.id === option.id && <span className="theme-check"><Check size={15} />{t("active")}</span>}
        </button>)}
      </div>
    </section>
  </div>
}


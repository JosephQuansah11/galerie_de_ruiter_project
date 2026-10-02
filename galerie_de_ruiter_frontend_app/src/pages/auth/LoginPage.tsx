import { LogIn, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export function LoginPage() {
  const auth = useAuth()
  const { t } = useLanguage()
  return <div className="page auth-page">
  <div className="auth-panel">
  <div className="eyebrow">{t("galleryName")}</div>
  <h1>{t("welcomeBack")}</h1>
  <p>{t("loginIntro")}</p>
  <button className="primary-button" onClick={auth.login}>
  <LogIn size={26} />{t("continueKeycloak")}
  </button>
  <Link className="quiet-button auth-login" to="/register">
  <UserPlus size={26} />{t("createAccount")}
  </Link>
  </div>
  <div className="auth-aside">
  <span>{t("theCollection")}</span>
  <strong>{t("objectsWorthReturning")}</strong>
  <p>{t("loginAsideText")}</p>
  </div>
  </div>
}

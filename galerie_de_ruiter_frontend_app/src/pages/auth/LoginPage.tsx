import { LogIn, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export function LoginPage() {
  const auth = useAuth()
  const { t } = useLanguage()
  return <div className="page auth-page"><div className="auth-panel"><div className="eyebrow">FABLE ACCESS</div><h1>{t("welcomeBack")}</h1><p>Sign in through Keycloak. Java validates your token and synchronizes your application profile.</p><button className="primary-button" onClick={auth.login}><LogIn size={16} />{t("continueKeycloak")}</button><Link className="quiet-button auth-login" to="/register"><UserPlus size={16} />{t("createAccount")}</Link></div><div className="auth-aside"><strong>One identity, shared everywhere.</strong><span>Your Keycloak roles decide which Java resources and pages you can access.</span></div></div>
}

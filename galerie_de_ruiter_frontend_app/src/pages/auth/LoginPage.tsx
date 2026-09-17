import { LogIn, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export function LoginPage() {
  const auth = useAuth()
  const { t } = useLanguage()
  return <div className="page auth-page"><div className="auth-panel"><div className="eyebrow">GALERIE DE RUITER</div><h1>{t("welcomeBack")}</h1><p>Enter a considered collection of antiques, art, and design pieces chosen for their next chapter.</p><button className="primary-button" onClick={auth.login}><LogIn size={16} />{t("continueKeycloak")}</button><Link className="quiet-button auth-login" to="/register"><UserPlus size={16} />{t("createAccount")}</Link></div><div className="auth-aside"><span>THE COLLECTION</span><strong>Objects worth returning to.</strong><p>Save pieces, arrange a visit, and keep the conversation with the gallery close at hand.</p></div></div>
}

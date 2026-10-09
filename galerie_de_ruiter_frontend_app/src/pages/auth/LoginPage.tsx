import { LogIn, MessageCircle, UserPlus } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Button } from "@/components/ReactButton";

export function LoginPage() {
  const auth = useAuth()
  const { t } = useLanguage()
  // The guard sends the visitor here with the page they wanted, so sign-in returns to it.
  const requestedPath = (useLocation().state as { from?: string } | null)?.from
  return <div className="page auth-page">
  <div className="auth-panel">
  <div className="eyebrow">{t("galleryName")}</div>
  <h1>{t("welcomeBack")}</h1>
  <p>{t("loginIntro")}</p>
  <Button className="primary-button" onClick={() => auth.login(requestedPath)}>
  <LogIn size={26} />{t("continueKeycloak")}
  </Button>
  <Link className="quiet-button auth-login" to="/register">
  <UserPlus size={26} />{t("createAccount")}
  </Link>
  <Link className="quiet-button auth-login" to="/chat">
  <MessageCircle size={26} />{t("talkToGallery")}
  </Link>
  </div>
  <div className="auth-aside">
  <span>{t("theCollection")}</span>
  <strong>{t("objectsWorthReturning")}</strong>
  <p>{t("loginAsideText")}</p>
  </div>
  </div>
}

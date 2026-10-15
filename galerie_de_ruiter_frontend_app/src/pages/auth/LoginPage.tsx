import { useEffect, useState } from 'react'
import { LogIn, MessageCircle, UserPlus } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { GOOGLE_IDENTITY_PROVIDER, useAuth } from '../../context/AuthContext'
import { getIdentityProviders } from './authApi'
import { useLanguage } from '../../context/LanguageContext'
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ReactButton";
import { GoogleMark } from "@/components/GoogleMark";

export function LoginPage() {
  const auth = useAuth()
  const { t } = useLanguage()
  // The sign-in page has nothing to offer a search result, so it stays out of the index.
  usePageMeta({ title: t("metaLoginTitle"), canonicalPath: "/login", noindex: true })
  // The guard sends the visitor here with the page they wanted, so sign-in returns to it. That
  // page is also the reason the visitor is here at all, which the notice spells out.
  const requestedPath = (useLocation().state as { from?: string } | null)?.from
  // Google is an identity provider inside the gallery's own realm, and the API is the service that
  // puts it there (see KeycloakGoogleIdentityProviderProvisioner). Asking whether it is really
  // there is what keeps this button from leading to a Keycloak error page on a deployment that was
  // never given a Google client. The button is offered until the answer arrives - and kept when no
  // answer ever arrives - because hiding a Google sign-in that works is worse than a button that is
  // briefly useless.
  const [googleAvailable, setGoogleAvailable] = useState(true)
  useEffect(() => {
    let active = true
    getIdentityProviders()
      .then((providers) => { if (active) setGoogleAvailable(providers.includes(GOOGLE_IDENTITY_PROVIDER)) })
      .catch(() => { /* Without an answer the realm stays the authority, not this page. */ })
    return () => { active = false }
  }, [])
  return <div className="page auth-page">
  <div className="auth-panel">
  <div className="eyebrow">{t("galleryName")}</div>
  <h1>{t("welcomeBack")}</h1>
  <p>{t("loginIntro")}</p>
  {requestedPath && <p className="auth-notice">{t("signInRequired")}</p>}
  <Button className="primary-button" onClick={() => auth.login(requestedPath)}>
  <LogIn size={26} />{t("continueKeycloak")}
  </Button>
  {/* Most visitors already have a Google account, so it gets its own button: it names the provider,
      which takes them straight to Google instead of to a Keycloak page with Google on it. */}
  {googleAvailable && <Button className="google-button" onClick={() => auth.loginWithGoogle(requestedPath)}>
  <GoogleMark size={22} />{t("continueGoogle")}
  </Button>}
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

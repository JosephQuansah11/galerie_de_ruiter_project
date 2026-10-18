import { useState, type FormEvent } from 'react'
import { LogIn, MessageCircle, UserPlus } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ReactButton";

/**
 * Signing in, on this page.
 *
 * The gallery's accounts are named by people rather than by addresses, so the first field takes a
 * username - `de-ruiter` - and the auth client turns it into the address the account is filed under.
 * An address typed in full works too, which is what a client who registered with one will do.
 *
 * Errors are shown here rather than on another page: a wrong password should not cost the visitor a
 * round trip, and it should not tell them whether the username was right and the password wrong.
 */
export function LoginPage() {
  const auth = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  usePageMeta({ title: t("metaLoginTitle"), canonicalPath: "/login", noindex: true })
  // The guard sends the visitor here with the page they wanted - now in the query, so it survives
  // the form's own error states as well as a reload.
  const requestedPath = new URLSearchParams(location.search).get("from") ?? undefined
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setError(undefined)
    setBusy(true)
    try {
      await auth.signIn(username, password)
      navigate(requestedPath ?? "/", { replace: true })
    } catch (failure) {
      const code = failure instanceof Error ? failure.message : "signInFailed"
      // The code is shown, not just logged: it is what distinguishes "no project configured" from
      // "wrong password" from "address not confirmed", and each needs a different fix.
      setError(`${t(`authError_${code}`, { defaultValue: t("signInFailed", { defaultValue: "Signing in failed. Please try again." }) })} (${code})`)
    } finally {
      setBusy(false)
    }
  }

  return <div className="page auth-page">
  <div className="auth-panel">
  <div className="eyebrow">{t("galleryName")}</div>
  <h1>{t("welcomeBack")}</h1>
  <p>{t("loginIntro")}</p>
  {requestedPath && <p className="auth-notice">{t("signInRequired")}</p>}
  <form className="auth-form" onSubmit={submit}>
    <label className="form-label" htmlFor="signin-username">{t("username", { defaultValue: "Username" })}</label>
    <input id="signin-username" className="form-control" name="username" autoComplete="username"
      value={username} onChange={(event) => setUsername(event.target.value)} required disabled={busy} />
    <label className="form-label" htmlFor="signin-password">{t("password", { defaultValue: "Password" })}</label>
    <input id="signin-password" className="form-control" name="password" type="password"
      autoComplete="current-password" value={password}
      onChange={(event) => setPassword(event.target.value)} required disabled={busy} />
    {error && <p className="auth-error" role="alert">{error}</p>}
    <Button className="primary-button" type="submit" disabled={busy} text={<><LogIn size={26} />{busy ? t("signingIn", { defaultValue: "Signing in…" }) : t("signIn", { defaultValue: "Sign in" })}</>} />
  </form>
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


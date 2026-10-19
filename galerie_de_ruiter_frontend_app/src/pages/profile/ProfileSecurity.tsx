import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ProfilePassword } from './ProfilePassword'

/**
 * What the account's protection is, and the one thing a visitor can change about it here.
 *
 * The card used to be read-only: it named the access level and the session, and said the sign-in
 * was "securely managed" without giving anyone a way to touch it. The password form lives here
 * because this is where a visitor looks for it.
 */
export function ProfileSecurity({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation()
  return <aside className="security-card">
    <div className="security-card-icon"><ShieldCheck size={24} /></div>
    <div className="eyebrow">{t("accountProtection")}</div>
    <h3>{t("accountProtected")}</h3>
    <p>{t("accountProtectedText")}</p>
    <div className="security-line"><span>{t("accessLevel")}</span><strong>{isAdmin ? t("administrator") : t("member")}</strong></div>
    <div className="security-line"><span>{t("session")}</span><strong className="online"><CheckCircle2 size={15} /> {t("active")}</strong></div>
    <section className="security-password">
      <div className="eyebrow">{t("password")}</div>
      <p>{t("passwordChangeIntro")}</p>
      <ProfilePassword />
    </section>
  </aside>
}

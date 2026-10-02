import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ProfileSecurity({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation()
  return <aside className="security-card"><div className="security-card-icon"><ShieldCheck size={24} /></div><div className="eyebrow">{t("accountProtection")}</div><h3>{t("accountProtected")}</h3><p>{t("accountProtectedText")}</p><div className="security-line"><span>{t("accessLevel")}</span><strong>{isAdmin ? t("administrator") : t("member")}</strong></div><div className="security-line"><span>{t("session")}</span><strong className="online"><CheckCircle2 size={15} /> {t("active")}</strong></div></aside>
}

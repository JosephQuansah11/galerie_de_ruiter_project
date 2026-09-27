import { CheckCircle2, ShieldCheck } from 'lucide-react'

export function ProfileSecurity({ isAdmin }: { isAdmin: boolean }) {
  return <aside className="security-card"><div className="security-card-icon"><ShieldCheck size={24} /></div><div className="eyebrow">ACCOUNT PROTECTION</div><h3>Your account is protected</h3><p>Your sign-in is securely managed. No authentication provider or technical configuration details are shown here.</p><div className="security-line"><span>Access level</span><strong>{isAdmin ? 'Administrator' : 'Member'}</strong></div><div className="security-line"><span>Session</span><strong className="online"><CheckCircle2 size={15} /> Active</strong></div></aside>
}

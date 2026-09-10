import { ShieldCheck } from 'lucide-react'

export function ProfileSecurity({ isAdmin }: { isAdmin: boolean }) {
  return <aside className="security-card"><ShieldCheck size={22} /><h3>Identity & access</h3><p>Authentication and authorization are handled by your Java service and Keycloak realm.</p><div className="security-line"><span>Provider</span><strong>Keycloak</strong></div><div className="security-line"><span>Roles</span><strong>{isAdmin ? 'Admin access' : 'User access'}</strong></div><div className="security-line"><span>API state</span><strong className="online">Connected</strong></div></aside>
}

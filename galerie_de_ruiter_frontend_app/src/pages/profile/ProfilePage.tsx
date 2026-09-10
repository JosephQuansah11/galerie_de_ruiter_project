import { DynamicForm, Avatar } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'
import type { FormField, UserProfile } from '../../types/types'
import { ProfileSecurity } from './ProfileSecurity'

export function ProfilePage() {
  const auth = useAuth(); const name = auth.profile?.username ?? 'Guest visitor'
  const fields: FormField<UserProfile>[] = [{ name: 'firstName', label: 'First name' }, { name: 'lastName', label: 'Last name' }, { name: 'email', label: 'Email', type: 'email' }]
  return <div className="page"><section className="profile-hero"><Avatar name={name} size="large" /><div><div className="eyebrow">ACCOUNT CENTRE</div><h1>{name}</h1><p>{auth.authenticated ? 'Your account is secured by Keycloak.' : 'Sign in to sync your personal movie timeline.'}</p><div className="role-list">{auth.roles.length ? auth.roles.map((role) => <span className="role-badge" key={role}>{role}</span>) : <span className="role-badge">GUEST</span>}</div></div></section><div className="profile-layout"><section className="form-panel"><div className="eyebrow">PROFILE DETAILS</div><h2>Tell us a little more</h2><DynamicForm<UserProfile> fields={fields} initialValue={{ username: name, firstName: auth.profile?.firstName ?? '', lastName: auth.profile?.lastName ?? '', email: auth.profile?.email ?? '' }} submitLabel="Update profile" onSubmit={() => undefined} /></section><ProfileSecurity isAdmin={auth.isAdmin} /></div></div>
}

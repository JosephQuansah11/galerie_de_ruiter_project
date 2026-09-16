import { DynamicForm, Avatar } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'
import type { FormField, UserProfile } from '../../types/types'
import { ProfileSecurity } from './ProfileSecurity'
import { ShieldCheck, Sparkles } from 'lucide-react'

export function ProfilePage() {
  const auth = useAuth(); const name = auth.profile?.username ?? 'Guest visitor'
  const fields: FormField<UserProfile>[] = [{ name: 'firstName', label: 'First name' }, { name: 'lastName', label: 'Last name' }, { name: 'email', label: 'Email', type: 'email' }]
  return <div className="profile-page"><section className="profile-hero"><div className="profile-hero-art"><Sparkles size={22} /><span>GALERIE MEMBER</span></div><Avatar name={name} size="large" /><div className="profile-hero-copy"><div className="eyebrow">ACCOUNT CENTRE</div><h1>{name}</h1><p>{auth.authenticated ? 'Your account is ready for the gallery experience.' : 'Sign in to personalize your gallery experience.'}</p><div className="profile-access-summary"><ShieldCheck size={16} /> {auth.isAdmin ? 'Gallery administrator' : 'Gallery member'}</div></div></section><div className="profile-layout"><section className="form-panel profile-details-panel"><div className="profile-section-icon"><ShieldCheck size={20} /></div><div className="eyebrow">PROFILE DETAILS</div><h2>Make it yours</h2><p className="profile-section-intro">Keep your contact details ready for purchases, appointments and gallery updates.</p><DynamicForm<UserProfile> fields={fields} initialValue={{ username: name, firstName: auth.profile?.firstName ?? '', lastName: auth.profile?.lastName ?? '', email: auth.profile?.email ?? '' }} submitLabel="Update profile" onSubmit={() => undefined} /></section><ProfileSecurity isAdmin={auth.isAdmin} /></div></div>
}

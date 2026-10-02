import { DynamicForm, Avatar } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'
import type { FormField, UserProfile } from '../../types/types'
import { ProfileSecurity } from './ProfileSecurity'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ProfilePage() {
  const auth = useAuth(); const { t } = useTranslation(); const name = auth.profile?.username ?? t("guestVisitor")
  const fields: FormField<UserProfile>[] = [{ name: 'firstName', label: t("firstName") }, { name: 'lastName', label: t("lastName") }, { name: 'email', label: t("email"), type: 'email' }]
  return <div className="profile-page">
  <section className="profile-hero">
      <div className="profile-hero-art">
      <Sparkles size={22} />
      <span>{t("galerieMember")}</span>
      </div>
      <Avatar name={name} size="large" />
      <div className="profile-hero-copy">
      <div className="eyebrow">{t("accountCentre")}</div>
      <h1>{name}</h1>
      <p>{auth.authenticated ? t("accountReady") : t("signInToPersonalize")}</p>
      <div className="profile-access-summary">
      <ShieldCheck size={16} /> {auth.isAdmin ? t("galleryAdministrator") : t("galleryMember")}</div>
      </div>
  </section>
  
  <div className="profile-layout">
  <section className="form-panel profile-details-panel">
  <div className="profile-section-icon">
  <ShieldCheck size={20} /></div><div className="eyebrow">{t("profileDetails")}</div>
  <h2>{t("makeItYours")}</h2>
  <p className="profile-section-intro">{t("profileSectionIntro")}</p>
  <DynamicForm<UserProfile> fields={fields} initialValue={{ username: name, firstName: auth.profile?.firstName ?? '', lastName: auth.profile?.lastName ?? '', email: auth.profile?.email ?? '' }} submitLabel={t("updateProfile")} onSubmit={() => undefined} /></section><ProfileSecurity isAdmin={auth.isAdmin} /></div></div>
}

import { useState } from 'react'
import { DynamicForm } from '../../components/UI'
import { Avatar } from '../../components/Avatar'
import { useAuth } from '../../context/AuthContext'
import type { FormField, UserProfile } from '../../types/types'
import { ProfileSecurity } from './ProfileSecurity'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ProfileAvatarUpload } from './ProfileAvatarUpload'
import { describeApiError } from '../../apis/apiError'

export function ProfilePage() {
  const auth = useAuth(); const { t } = useTranslation(); const name = auth.profile?.username ?? t("guestVisitor")
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const fields: FormField<UserProfile>[] = [{ name: 'firstName', label: t("firstName"), required: true }, { name: 'lastName', label: t("lastName"), required: true }, { name: 'email', label: t("email"), type: 'email', required: true }]
  const saveProfile = async (value: UserProfile) => {
    if (saving) return
    setSaving(true)
    setSaveMessage('')
    const details = {
      firstName: (value.firstName ?? '').trim(),
      lastName: (value.lastName ?? '').trim(),
      email: (value.email ?? '').trim(),
    }
    if (!details.firstName || !details.lastName || !details.email) {
      setSaveMessage(t('profileUpdateRequiredFields'))
      setSaving(false)
      return
    }
    try {
      await auth.updateProfile(details)
      setSaveMessage(t('profileUpdateSucceeded'))
    } catch (thrown) {
      // Show the API reason (session, CSRF or validation) instead of a generic failure.
      setSaveMessage(describeApiError(thrown, t('profileUpdateFailed')))
    } finally {
      setSaving(false)
    }
  }
  return <div className="profile-page">
  <section className="profile-hero">
      <div className="profile-hero-art">
      <Sparkles size={22} />
      <span>{t("galerieMember")}</span>
      </div>
      <Avatar
        name={name}
        firstName={auth.profile?.firstName}
        lastName={auth.profile?.lastName}
        imageUrl={auth.avatarUrl}
        size="large"
      />
      <ProfileAvatarUpload />
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
  <DynamicForm<UserProfile> key={`${name}:${auth.profile?.email ?? ''}:${auth.profile?.firstName ?? ''}:${auth.profile?.lastName ?? ''}`} fields={fields} initialValue={{ username: name, firstName: auth.profile?.firstName ?? '', lastName: auth.profile?.lastName ?? '', email: auth.profile?.email ?? '' }} submitLabel={saving ? t("savingProfile") : t("updateProfile")} onSubmit={saveProfile} />
  {saveMessage && <p role="status" aria-live="polite">{saveMessage}</p>}
  </section><ProfileSecurity isAdmin={auth.isAdmin} /></div></div>
}

export interface UserProfile {
  id?: number
  username: string
  email?: string
  firstName?: string
  lastName?: string
}

export type UserProfileUpdate = Pick<UserProfile, 'email' | 'firstName' | 'lastName'>

/**
 * What signing up collects: an address its owner can receive mail at, the name to show in the
 * account menu, and a password. There is no username field - Supabase files the account under the
 * address, and the display name is metadata rather than a second identifier.
 */
export interface Registration {
  email: string
  password: string
  displayName: string
}

export interface FormField<T> {
  name: keyof T & string
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'
  placeholder?: string
  /** What the browser may suggest here, so a password manager fills the right field. */
  autoComplete?: string
  options?: string[]
  required?: boolean
}

export interface Antique{
  id?: number
  title: string
  description?: string
  price?: number
  releaseYear?: number
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
  rating?: number
}

export interface UserProfile {
  id?: number
  username: string
  email?: string
  firstName?: string
  lastName?: string
}

export interface FormField<T> {
  name: keyof T & string
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'
  placeholder?: string
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
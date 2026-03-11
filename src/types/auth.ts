import type { FirestoreTimestamp } from './common'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: 'supervisor'
  createdAt: FirestoreTimestamp
  lastLoginAt: FirestoreTimestamp
}

export interface AuthState {
  user: AppUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { DEMO_USER } from '@/lib/mock-data'
import type { AppUser } from '@/types/auth'

const DEMO_MODE = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key'

export function isDemoMode(): boolean {
  return DEMO_MODE
}

export async function loginWithEmail(email: string, password: string): Promise<AppUser> {
  if (DEMO_MODE) {
    if (email === 'admin@demo.com' && password === 'demo1234') {
      sessionStorage.setItem('demo_logged_in', 'true')
      return DEMO_USER
    }
    throw new Error('Credenciales incorrectas. Usa admin@demo.com / demo1234')
  }

  const credential = await signInWithEmailAndPassword(auth, email, password)
  const appUser = await fetchUserProfile(credential.user.uid)

  if (!appUser) {
    await signOut(auth)
    throw new Error('Usuario no encontrado en el sistema')
  }

  if (appUser.role !== 'supervisor') {
    await signOut(auth)
    throw new Error('Acceso denegado: solo supervisores pueden acceder')
  }

  await updateDoc(doc(db, 'users', credential.user.uid), {
    lastLoginAt: serverTimestamp(),
  })

  return appUser
}

export async function logout(): Promise<void> {
  if (DEMO_MODE) {
    sessionStorage.removeItem('demo_logged_in')
    return
  }
  await signOut(auth)
}

export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  if (DEMO_MODE) {
    if (uid === DEMO_USER.uid) return DEMO_USER
    return null
  }
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...snap.data() } as AppUser
}

export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (DEMO_MODE) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

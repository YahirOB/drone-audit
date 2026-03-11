import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { AppUser } from '@/types/auth'

export async function loginWithEmail(email: string, password: string): Promise<AppUser> {
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
  await signOut(auth)
}

export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...snap.data() } as AppUser
}

export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback)
}

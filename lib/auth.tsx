'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User, onAuthStateChanged, signInWithEmailAndPassword,
  signOut, sendPasswordResetEmail, createUserWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export type Role = 'admin' | 'team_owner' | null
export interface AppUser {
  uid: string
  email: string | null
  displayName: string
  role: Role
  teamId?: string
  teamName?: string
}

interface AuthCtx {
  user: User | null
  appUser: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AppUser>
  register: (email: string, password: string, displayName: string) => Promise<AppUser>
  logout: () => Promise<void>
  resetPwd: (email: string) => Promise<void>
}

const Ctx = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) setAppUser({ uid: u.uid, email: u.email, ...(snap.data() as any) })
      } else setAppUser(null)
      setLoading(false)
    })
  }, [])

  const login = async (email: string, password: string): Promise<AppUser> => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    if (!snap.exists()) throw new Error('User profile not found. Contact admin.')
    const au = { uid: cred.user.uid, email: cred.user.email, ...(snap.data() as any) } as AppUser
    setAppUser(au)
    return au
  }

  const register = async (email: string, password: string, displayName: string): Promise<AppUser> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const profile = { displayName, role: 'team_owner', email }
    await setDoc(doc(db, 'users', cred.user.uid), profile)
    const au = { uid: cred.user.uid, ...profile } as AppUser
    setAppUser(au)
    return au
  }

  const logout  = async () => { await signOut(auth); setAppUser(null) }
  const resetPwd = (e: string) => sendPasswordResetEmail(auth, e)

  return <Ctx.Provider value={{ user, appUser, loading, login, register, logout, resetPwd }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)

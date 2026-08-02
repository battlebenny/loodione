import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { resolveAuthState, type AuthProfile, type AuthState } from './auth-state.js'
import { isValidHandle, normalizeHandle } from './handles.js'
import { abandonIncompleteAccount, linkGoogleIdentity, refreshSessionUser, signInWithGoogle, signInWithMagicLink, signOut, unlinkGoogleIdentity, updateEmail, updateProfileColor } from './auth-service.js'
import { toUserFacingAuthError } from './errors.js'

export interface AuthSession {
  userId: string
  accessToken: string
  expiresAt: number
  handle?: string
}

export interface AuthContextValue {
  state: AuthState
  profile: AuthProfile | null
  session: AuthSession | null
  email: string | null
  hasGoogleIdentity: boolean
  error: Error | null
  signInWithGoogle(): Promise<void>
  signInWithMagicLink(email: string): Promise<void>
  signOut(): Promise<void>
  abandonIncompleteAccount(): Promise<void>
  updateEmail(email: string): Promise<void>
  linkGoogleIdentity(): Promise<void>
  unlinkGoogleIdentity(): Promise<void>
  updateProfileColor(color: string): Promise<void>
  completeHandle(handle: string): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function redirectUrl(value?: string): string {
  return value || window.location.origin
}

function toAuthSession(session: Session | null, profile: AuthProfile | null): AuthSession | null {
  if (!session) return null
  return {
    userId: session.user.id,
    accessToken: session.access_token,
    expiresAt: (session.expires_at ?? 0) * 1000,
    ...(profile?.handle ? { handle: profile.handle } : {}),
  }
}

export function AuthProvider({ client, redirectTo, children }: { client: SupabaseClient; redirectTo?: string; children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading')
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const { data, error: sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        const session = data.session ? await refreshSessionUser(client, data.session) : null
        let nextProfile: AuthProfile | null = null
        if (session) {
          const { data: profileData, error: profileError } = await client
            .from('profiles').select('id, handle, profile_color').eq('id', session.user.id).maybeSingle()
          if (profileError) throw profileError
          nextProfile = profileData ? {
            id: profileData.id,
            handle: profileData.handle,
            profileColor: profileData.profile_color,
          } : null
        }
        if (!active) return
        setCurrentSession(session)
        setProfile(nextProfile)
        setState(resolveAuthState(session, nextProfile))
        setError(null)
      } catch (cause) {
        if (!active) return
        setError(cause instanceof Error ? cause : new Error(String(cause)))
        setState('error')
      }
    }
    void load()
    const { data: listener } = client.auth.onAuthStateChange(() => { void load() })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [client])

  const value = useMemo<AuthContextValue>(() => ({
    state,
    profile,
    session: toAuthSession(currentSession, profile),
    email: currentSession?.user.email ?? null,
    hasGoogleIdentity: currentSession?.user.identities?.some((identity) => identity.provider === 'google') ?? false,
    error,
    signInWithGoogle: () => signInWithGoogle(client, redirectUrl(redirectTo)),
    signInWithMagicLink: (email) => signInWithMagicLink(client, email, redirectUrl(redirectTo)),
    signOut: () => signOut(client),
    abandonIncompleteAccount: () => abandonIncompleteAccount(client),
    updateEmail: (email) => updateEmail(client, email),
    linkGoogleIdentity: () => linkGoogleIdentity(client, redirectUrl(redirectTo)),
    unlinkGoogleIdentity: async () => {
      const user = await unlinkGoogleIdentity(client)
      setCurrentSession((session) => session ? { ...session, user } : session)
    },
    updateProfileColor: async (color) => {
      if (!currentSession) throw new Error('Connexion requise')
      await updateProfileColor(client, currentSession.user.id, color)
      setProfile((current) => current ? { ...current, profileColor: color } : current)
    },
    completeHandle: async (handle) => {
      const normalized = normalizeHandle(handle)
      if (!isValidHandle(normalized)) throw new Error('Le handle doit contenir 3 à 24 caractères : lettres minuscules, chiffres ou underscore.')
      if (!currentSession) throw new Error('Connexion requise')
      const { error: insertError } = await client.from('profiles').insert({ id: currentSession.user.id, handle: normalized })
      if (insertError) throw new Error(toUserFacingAuthError(insertError.message))
      setProfile({ id: currentSession.user.id, handle: normalized })
      setState('authenticated')
    },
  }), [client, currentSession, error, profile, redirectTo, state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (value) return value
  // Makes presentation components testable in isolation. The application
  // always provides AuthProvider; actions outside it fail safely.
  const unavailable = async () => { throw new Error('Authentification indisponible') }
  return {
    state: 'anonymous', profile: null, session: null, email: null, hasGoogleIdentity: false, error: null,
    signInWithGoogle: unavailable,
    signInWithMagicLink: unavailable,
    signOut: unavailable,
    abandonIncompleteAccount: unavailable,
    updateEmail: unavailable,
    linkGoogleIdentity: unavailable,
    unlinkGoogleIdentity: unavailable,
    updateProfileColor: unavailable,
    completeHandle: unavailable,
  }
}

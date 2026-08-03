export type AuthState = 'loading' | 'anonymous' | 'authenticated' | 'handle-required' | 'error'

export interface AuthProfile {
  id: string
  handle: string
  profileColor?: string
}

interface SessionLike {
  user: { id: string }
}

export function resolveAuthState(session: SessionLike | null, profile: AuthProfile | null): AuthState {
  if (!session) return 'anonymous'
  return profile?.handle ? 'authenticated' : 'handle-required'
}

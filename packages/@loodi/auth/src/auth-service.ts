import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { toUserFacingAuthError } from './errors.js'

async function throwIfError(result: { error: { message: string } | null }): Promise<void> {
  if (result.error) throw new Error(toUserFacingAuthError(result.error.message))
}

export async function signInWithGoogle(client: SupabaseClient, redirectTo: string): Promise<void> {
  await throwIfError(await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } }))
}

export async function signInWithMagicLink(client: SupabaseClient, email: string, redirectTo: string): Promise<void> {
  await throwIfError(await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } }))
}

/** Completes a magic-link or OAuth callback received through a native deep link. */
export async function completeAuthCallback(client: SupabaseClient, callbackUrl: string): Promise<void> {
  const url = new URL(callbackUrl)
  const errorDescription = url.searchParams.get('error_description')
    ?? new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash).get('error_description')
  if (errorDescription) throw new Error(toUserFacingAuthError(errorDescription))

  const code = url.searchParams.get('code')
  if (code) {
    await throwIfError(await client.auth.exchangeCodeForSession(code))
    return
  }

  const fragment = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)
  const accessToken = fragment.get('access_token')
  const refreshToken = fragment.get('refresh_token')
  if (!accessToken || !refreshToken) throw new Error('Ce lien de connexion est incomplet ou a expiré.')
  await throwIfError(await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }))
}

export async function linkGoogleIdentity(client: SupabaseClient, redirectTo: string): Promise<void> {
  await throwIfError(await client.auth.linkIdentity({ provider: 'google', options: { redirectTo } }))
}

export async function unlinkGoogleIdentity(client: SupabaseClient): Promise<User> {
  const { data, error } = await client.auth.getUser()
  await throwIfError({ error })
  const identity = data.user?.identities?.find((candidate) => candidate.provider === 'google')
  if (!identity) throw new Error('Aucun compte Google n’est associé.')
  const result = await client.auth.unlinkIdentity(identity) as {
    data: { user: User | null } | null
    error: { message: string } | null
  }
  await throwIfError(result)
  const user = result.data?.user
  if (!user) throw new Error('Impossible de mettre à jour le compte Google.')
  return user
}

/** getSession may retain stale identity metadata; getUser reads the current Auth record. */
export async function refreshSessionUser(client: SupabaseClient, session: Session): Promise<Session> {
  const { data, error } = await client.auth.getUser()
  await throwIfError({ error })
  if (!data.user) throw new Error('Session invalide.')
  return { ...session, user: data.user }
}

/** Removes the current Auth user only after the server confirms it has no Loodi profile. */
export async function abandonIncompleteAccount(client: SupabaseClient): Promise<void> {
  await throwIfError(await client.functions.invoke('abandon-incomplete-account'))
  await throwIfError(await client.auth.signOut({ scope: 'local' }))
}

export async function updateEmail(client: SupabaseClient, email: string): Promise<void> {
  await throwIfError(await client.auth.updateUser({ email }))
}

export async function updateProfileColor(client: SupabaseClient, userId: string, color: string): Promise<void> {
  await throwIfError(await client.from('profiles').update({ profile_color: color }).eq('id', userId))
}

export async function signOut(client: SupabaseClient): Promise<void> {
  await throwIfError(await client.auth.signOut())
}

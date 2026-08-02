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

import { describe, expect, it, vi } from 'vitest'
import { abandonIncompleteAccount, deleteAccount, completeAuthCallback, linkGoogleIdentity, refreshSessionUser, signInWithGoogle, signInWithMagicLink, unlinkGoogleIdentity, updateEmail, updateProfileColor } from './auth-service.js'

describe('auth sign-in actions', () => {
  it('starts Google OAuth with the caller-provided safe redirect URL', async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ error: null })
    await expect(signInWithGoogle({ auth: { signInWithOAuth } } as never, 'https://one.loodi.test:4001')).resolves.toBeUndefined()
    expect(signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'https://one.loodi.test:4001' } })
  })

  it('sends magic links to the same explicit redirect URL', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
    await expect(signInWithMagicLink({ auth: { signInWithOtp } } as never, 'player@loodi.app', 'https://one.loodi.test:4001')).resolves.toBeUndefined()
    expect(signInWithOtp).toHaveBeenCalledWith({ email: 'player@loodi.app', options: { emailRedirectTo: 'https://one.loodi.test:4001' } })
  })

  it('stores a native magic-link session from the callback URL fragment', async () => {
    const setSession = vi.fn().mockResolvedValue({ error: null })

    await expect(completeAuthCallback({ auth: { setSession } } as never, 'com.loodi.one://auth/callback#access_token=access&refresh_token=refresh'))
      .resolves.toBeUndefined()

    expect(setSession).toHaveBeenCalledWith({ access_token: 'access', refresh_token: 'refresh' })
  })

  it('exchanges a native PKCE callback code for a session', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })

    await expect(completeAuthCallback({ auth: { exchangeCodeForSession } } as never, 'com.loodi.one://auth/callback?code=pkce-code'))
      .resolves.toBeUndefined()

    expect(exchangeCodeForSession).toHaveBeenCalledWith('pkce-code')
  })

  it('links Google to the authenticated account with the caller-provided redirect URL', async () => {
    const linkIdentity = vi.fn().mockResolvedValue({ error: null })
    await expect(linkGoogleIdentity({ auth: { linkIdentity } } as never, 'https://one.loodi.test:4001')).resolves.toBeUndefined()
    expect(linkIdentity).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'https://one.loodi.test:4001' } })
  })

  it('requests an email change from the authenticated account', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    await expect(updateEmail({ auth: { updateUser } } as never, 'new@loodi.app')).resolves.toBeUndefined()
    expect(updateUser).toHaveBeenCalledWith({ email: 'new@loodi.app' })
  })

  it('persists the chosen profile colour on the signed-in profile only', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })

    await expect(updateProfileColor({ from } as never, 'user-id', '#4B6A68')).resolves.toBeUndefined()

    expect(from).toHaveBeenCalledWith('profiles')
    expect(update).toHaveBeenCalledWith({ profile_color: '#4B6A68' })
    expect(eq).toHaveBeenCalledWith('id', 'user-id')
  })

  it('deletes an abandoned account through the authenticated server function before clearing the local session', async () => {
    const invoke = vi.fn().mockResolvedValue({ error: null })
    const signOut = vi.fn().mockResolvedValue({ error: null })

    await expect(abandonIncompleteAccount({ functions: { invoke }, auth: { signOut } } as never)).resolves.toBeUndefined()

    expect(invoke).toHaveBeenCalledWith('abandon-incomplete-account')
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('deletes a finalized account through the authenticated server function before clearing the local session', async () => {
    const invoke = vi.fn().mockResolvedValue({ error: null })
    const signOut = vi.fn().mockResolvedValue({ error: null })

    await expect(deleteAccount({ functions: { invoke }, auth: { signOut } } as never)).resolves.toBeUndefined()

    expect(invoke).toHaveBeenCalledWith('delete-account')
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('unlinks only the Google identity from an authenticated account', async () => {
    const googleIdentity = { id: 'google-id', provider: 'google' }
    const updatedUser = { id: 'user-id', identities: [{ id: 'email-id', provider: 'email' }] }
    const getUser = vi.fn().mockResolvedValue({ data: { user: { identities: [{ id: 'email-id', provider: 'email' }, googleIdentity] } }, error: null })
    const unlinkIdentity = vi.fn().mockResolvedValue({ data: { user: updatedUser }, error: null })

    await expect(unlinkGoogleIdentity({ auth: { getUser, unlinkIdentity } } as never)).resolves.toBe(updatedUser)

    expect(unlinkIdentity).toHaveBeenCalledWith(googleIdentity)
  })

  it('refreshes the cached session user from Supabase before reading its identities', async () => {
    const session = { user: { id: 'user-id', identities: [{ provider: 'google' }] } }
    const currentUser = { id: 'user-id', identities: [{ provider: 'email' }] }
    const getUser = vi.fn().mockResolvedValue({ data: { user: currentUser }, error: null })

    await expect(refreshSessionUser({ auth: { getUser } } as never, session as never))
      .resolves.toEqual({ ...session, user: currentUser })
  })
})

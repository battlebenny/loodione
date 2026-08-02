import { describe, expect, it } from 'vitest'
import { toUserFacingAuthError } from './errors.js'

describe('toUserFacingAuthError', () => {
  it('explains a handle collision without leaking database details', () => {
    expect(toUserFacingAuthError('duplicate key value violates unique constraint "profiles_handle_key"'))
      .toBe('Ce nom de joueur est déjà pris. Et si tu en essayais un autre ?')
  })

  it('translates provider validation errors for the French interface', () => {
    expect(toUserFacingAuthError('One of email or phone must be set'))
      .toBe('Indique ton e-mail pour recevoir un lien de connexion.')
  })

  it('explains common e-mail update failures without leaking provider details', () => {
    expect(toUserFacingAuthError('Email rate limit exceeded'))
      .toBe('Trop de messages ont été envoyés. Réessaie un peu plus tard.')
    expect(toUserFacingAuthError('Email address is already registered'))
      .toBe('Cette adresse e-mail est déjà associée à un compte Loodi.')
    expect(toUserFacingAuthError('Error sending confirmation email'))
      .toBe('L’e-mail de confirmation n’a pas pu être envoyé. Réessaie un peu plus tard.')
  })

  it('explains when a Google identity already belongs to another account', () => {
    expect(toUserFacingAuthError('Identity is already linked to another user'))
      .toBe('Ce compte Google est déjà associé à un autre compte Loodi.')
  })

  it('explains when the Supabase project disallows manual identity linking', () => {
    expect(toUserFacingAuthError('Manual linking is disabled'))
      .toBe('L’association de compte Google doit être activée dans les réglages Supabase.')
  })
})

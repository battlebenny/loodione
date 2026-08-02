import { describe, expect, it } from 'vitest'
import { resolveAuthState } from './auth-state.js'

describe('resolveAuthState', () => {
  it('keeps guests anonymous and requires a handle for sessions without a profile', () => {
    expect(resolveAuthState(null, null)).toBe('anonymous')
    expect(resolveAuthState({ user: { id: 'user-1' } }, null)).toBe('handle-required')
  })

  it('authenticates only sessions with a valid profile handle', () => {
    expect(resolveAuthState({ user: { id: 'user-1' } }, { id: 'user-1', handle: 'meeple' })).toBe('authenticated')
  })
})

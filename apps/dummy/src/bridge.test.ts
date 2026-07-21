import { describe, expect, it } from 'vitest'
import { resolveDummyShellOrigin } from './bridge'

describe('resolveDummyShellOrigin', () => {
  it('accepts the shell referrer URL and returns only its known origin', () => {
    expect(resolveDummyShellOrigin('https://one.loodi.test:4001/')).toBe('https://one.loodi.test:4001')
  })

  it('rejects an untrusted referrer origin', () => {
    expect(resolveDummyShellOrigin('https://untrusted.example/settings')).toBeNull()
  })
})

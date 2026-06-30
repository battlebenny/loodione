import { describe, it, expect, beforeEach } from 'vitest'
import { resolveTheme } from '../theme'

beforeEach(() => {
  // mock `prefers-color-scheme` to a known default before each test
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

describe('resolveTheme', () => {
  it('returns "light" when mode is "light"', () => {
    expect(resolveTheme('light')).toBe('light')
  })

  it('returns "dark" when mode is "dark"', () => {
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('returns the system preference when mode is "system" and prefers-color-scheme is light', () => {
    expect(resolveTheme('system')).toBe('light')
  })

  it('returns "dark" when mode is "system" and prefers-color-scheme is dark', () => {
    window.matchMedia = ((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? true : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia

    expect(resolveTheme('system')).toBe('dark')
  })
})

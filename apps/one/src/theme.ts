export type ThemeMode = 'system' | 'dark' | 'light'

export function normalizeThemeMode(value: unknown): ThemeMode {
  if (value === 'dark' || value === 'light' || value === 'system') return value
  if (value === 'auto') return 'system'
  return 'system'
}

export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  const normalizedMode = normalizeThemeMode(mode)
  if (normalizedMode !== 'system') return normalizedMode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

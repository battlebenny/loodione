import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const packageRoot = resolve(process.cwd())

describe('package distribution', () => {
  it('declares only the public runtime, Vite helper and stylesheet entry points', () => {
    const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>
    }
    expect(Object.keys(manifest.exports)).toEqual(['.', './vite', './styles.css', './package.json'])
  })

  it('keeps the published stylesheet in the package files', () => {
    expect(existsSync(resolve(packageRoot, 'src/styles.css'))).toBe(true)
    expect(readFileSync(resolve(packageRoot, 'src/styles.css'), 'utf8')).toContain('.loodi-pwa-offline-banner')
  })

  it('places the install prompt above the shared bottom navigation and safe area', () => {
    const css = readFileSync(resolve(packageRoot, 'src/styles.css'), 'utf8')

    expect(css).toContain('--loodi-pwa-bottom-nav-height: 56px')
    expect(css).toContain('--loodi-pwa-safe-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))')
    expect(css).toContain('bottom: calc(1rem + var(--loodi-pwa-bottom-nav-height) + 1rem + var(--loodi-pwa-safe-bottom))')
    expect(css).toContain('.loodi-pwa-install-prompt {\n  z-index: 60;')
  })
})

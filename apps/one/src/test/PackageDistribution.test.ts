import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const uiDirectory = resolve(process.cwd(), '../../packages/@loodi/ui')

function manifest(packageName: 'bridge' | 'ui') {
  return JSON.parse(readFileSync(
    resolve(process.cwd(), `../../packages/@loodi/${packageName}/package.json`),
    'utf8',
  )) as Record<string, unknown>
}

describe('published package manifests', () => {
  it('exposes the bridge as a typed, publishable ESM package', () => {
    const pkg = manifest('bridge')

    expect(pkg.private).toBeUndefined()
    expect(pkg.types).toBe('./dist/index.d.ts')
    expect(pkg.files).toEqual(['dist', 'README.md'])
    expect(pkg.exports).toMatchObject({
      '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    })
    expect(pkg.publishConfig).toEqual({ access: 'public' })
  })

  it('publishes @loodi/ui 0.3.0 as modular typed ESM with individual styles', () => {
    const pkg = manifest('ui')

    expect(pkg.version).toBe('0.3.0')
    expect(pkg.private).toBeUndefined()
    expect(pkg.types).toBe('./dist/index.d.ts')
    expect(pkg.files).toEqual(['dist', 'README.md'])
    expect(pkg.exports).toMatchObject({
      '.': { types: './dist/index.d.ts', import: './dist/index.js' },
      './mini-header': { types: './dist/mini-header.d.ts', import: './dist/mini-header.js' },
      './bottom-nav': { types: './dist/bottom-nav.d.ts', import: './dist/bottom-nav.js' },
      './launcher': { types: './dist/launcher.d.ts', import: './dist/launcher.js' },
      './styles.css': './dist/styles.css',
      './tokens.css': './dist/tokens.css',
      './tokens.dtcg.json': './dist/tokens.dtcg.json',
      './mini-header.css': './dist/mini-header.css',
      './bottom-nav.css': './dist/bottom-nav.css',
      './launcher.css': './dist/launcher.css',
    })
    expect(pkg.sideEffects).toEqual([
      './dist/styles.css',
      './dist/tokens.css',
      './dist/mini-header.css',
      './dist/bottom-nav.css',
      './dist/launcher.css',
    ])
    expect(pkg.publishConfig).toEqual({ access: 'public' })
  })

  it('derives CSS and DTCG tokens from one canonical source', () => {
    const canonical = resolve(uiDirectory, 'src/tokens.source.json')
    const css = resolve(uiDirectory, 'src/tokens.css')
    const dtcg = resolve(uiDirectory, 'src/tokens.dtcg.json')

    expect(existsSync(canonical)).toBe(true)
    expect(existsSync(dtcg)).toBe(true)
    expect(readFileSync(css, 'utf8')).toContain('--spacing-xl')
    expect(readFileSync(css, 'utf8')).toContain('--radius-2xl')
    expect(readFileSync(css, 'utf8')).toContain('--typography-display')
    expect(readFileSync(css, 'utf8')).toContain('--shadow-elevated')
    expect(readFileSync(dtcg, 'utf8')).toContain('typography')
  })

  it('ships the exact Collec surface and text tokens in CSS and DTCG', () => {
    const css = readFileSync(resolve(uiDirectory, 'dist/tokens.css'), 'utf8')
    const dtcg = JSON.parse(readFileSync(resolve(uiDirectory, 'dist/tokens.dtcg.json'), 'utf8')) as {
      color: Record<string, { $value: string }>
    }

    expect(css).toContain('--color-surface-subtle: #F2F0EC;')
    expect(css).toContain('--color-surface-subtle-dark: #3A3A35;')
    expect(css).toContain('--color-text-primary: #1A1A18;')
    expect(css).toContain('--color-text-primary-dark: var(--color-text-dark);')
    expect(css).toContain('--color-text-secondary: #6B6B60;')
    expect(css).toContain('--color-text-secondary-dark: #A3A39A;')
    expect(dtcg.color['text-primary-dark'].$value).toBe('{color.text-dark}')
  })

  it('keeps styles.css as the backwards-compatible aggregation of all public CSS', () => {
    const styles = readFileSync(resolve(uiDirectory, 'src/styles.css'), 'utf8')

    expect(styles).toContain('@import "./tokens.css"')
    expect(styles).toContain('@import "./mini-header.css"')
    expect(styles).toContain('@import "./bottom-nav.css"')
    expect(styles).toContain('@import "./launcher.css"')
  })

  it('makes One consume only public @loodi/ui entry points', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8')
    const appCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
    const tsconfig = readFileSync(resolve(process.cwd(), 'tsconfig.json'), 'utf8')

    expect(app).toContain("from '@loodi/ui/mini-header'")
    expect(app).toContain("from '@loodi/ui/bottom-nav'")
    expect(app).toContain("from '@loodi/ui/launcher'")
    expect(appCss).toContain("@import '@loodi/ui/tokens.css';")
    expect(appCss).toContain("@import '@loodi/ui/mini-header.css';")
    expect(appCss).toContain("@import '@loodi/ui/bottom-nav.css';")
    expect(appCss).toContain("@import '@loodi/ui/launcher.css';")
    expect(appCss).not.toContain('packages/@loodi/ui/src')
    expect(tsconfig).not.toContain('packages/@loodi/ui/src')
    expect(tsconfig).not.toContain('"@loodi/ui"')
  })

  it('only whitelists dist and README for npm packaging', () => {
    const pkg = manifest('ui')

    expect(pkg.files).toEqual(['dist', 'README.md'])
  })

  it('excludes ui source files from the npm tarball', () => {
    const output = execFileSync('npm', [
      'pack', '--dry-run', '--json', '--ignore-scripts', '-w', '@loodi/ui',
    ], {
      cwd: resolve(process.cwd(), '../..'),
      encoding: 'utf8',
      env: { ...process.env, npm_config_cache: '/private/tmp/loodi-ui-npm-cache' },
    })
    const [pack] = JSON.parse(output) as [{ files: Array<{ path: string }> }]

    expect(pack.files.map((file) => file.path)).not.toContainEqual(expect.stringMatching(/^src\//))
  })
})

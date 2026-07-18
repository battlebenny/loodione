import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const uiDirectory = resolve(process.cwd(), '../../packages/@loodi/ui')
const bridgeDirectory = resolve(process.cwd(), '../../packages/@loodi/bridge')

function relativeLuminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16) / 255)

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${hex}`)
  }

  return channels
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((luminance, channel, index) => luminance + channel * [0.2126, 0.7152, 0.0722][index], 0)
}

function contrastRatio(first: string, second: string) {
  const [light, dark] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a)

  return (light + 0.05) / (dark + 0.05)
}

function manifest(packageName: 'bridge' | 'ui') {
  return JSON.parse(readFileSync(
    resolve(process.cwd(), `../../packages/@loodi/${packageName}/package.json`),
    'utf8',
  )) as Record<string, unknown>
}

describe('published package manifests', () => {
  it('exposes the bridge as a typed, publishable ESM package', () => {
    const pkg = manifest('bridge')

    expect(pkg.version).toBe('0.2.2')
    expect(pkg.private).toBeUndefined()
    expect(pkg.types).toBe('./dist/index.d.ts')
    expect(pkg.files).toEqual(['dist', 'README.md', 'CHANGELOG.md'])
    expect(pkg.exports).toMatchObject({
      '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    })
    expect(pkg.publishConfig).toEqual({ access: 'public' })
    expect(readFileSync(resolve(bridgeDirectory, 'dist/BridgeClient.d.ts'), 'utf8')).toContain('ready(): void')
    expect(readFileSync(resolve(bridgeDirectory, 'dist/BridgeClient.d.ts'), 'utf8')).toContain('navigate(path: string): void')
  })

  it('publishes @loodi/ui 0.5.1 as modular typed ESM with individual styles', () => {
    const pkg = manifest('ui')

    expect(pkg.version).toBe('0.5.1')
    expect(pkg.private).toBeUndefined()
    expect(pkg.types).toBe('./dist/index.d.ts')
    expect(pkg.files).toEqual(['dist', 'README.md', 'CHANGELOG.md'])
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

  it('ships the Collec page backgrounds without changing the dark value', () => {
    const css = readFileSync(resolve(uiDirectory, 'dist/tokens.css'), 'utf8')
    const dtcg = JSON.parse(readFileSync(resolve(uiDirectory, 'dist/tokens.dtcg.json'), 'utf8')) as {
      color: Record<string, { $value: string }>
    }

    expect(css).toContain('--color-bg-light: #fafaf8;')
    expect(css).toContain('--color-bg-dark: #1a1a18;')
    expect(dtcg.color['bg-light'].$value).toBe('#fafaf8')
    expect(dtcg.color['bg-dark'].$value).toBe('#1a1a18')
  })

  it('ships theme-resolved surfaces and accessible semantic status roles', () => {
    const css = readFileSync(resolve(uiDirectory, 'dist/tokens.css'), 'utf8')
    const styles = readFileSync(resolve(uiDirectory, 'dist/styles.css'), 'utf8')
    const dtcg = JSON.parse(readFileSync(resolve(uiDirectory, 'dist/tokens.dtcg.json'), 'utf8')) as {
      color: Record<string, { $value: string }>
      theme: Record<string, {
        light: { $type: string; $value: string }
        dark: { $type: string; $value: string }
      }>
    }
    const statuses = {
      danger: {
        solid: { light: '#DC2626', dark: '#DC2626' },
        'solid-hover': { light: '#B91C1C', dark: '#B91C1C' },
        surface: { light: '#FEF2F2', dark: '#450A0A' },
        'surface-strong': { light: '#FEE2E2', dark: '#7F1D1D' },
        border: { light: '#FECACA', dark: '#991B1B' },
        text: { light: '#B91C1C', dark: '#FECACA' },
      },
      warning: {
        solid: { light: '#B45309', dark: '#B45309' },
        'solid-hover': { light: '#92400E', dark: '#92400E' },
        surface: { light: '#FFFBEB', dark: '#451A03' },
        'surface-strong': { light: '#FEF3C7', dark: '#78350F' },
        border: { light: '#FDE68A', dark: '#92400E' },
        text: { light: '#92400E', dark: '#FDE68A' },
      },
      success: {
        solid: { light: '#047857', dark: '#047857' },
        'solid-hover': { light: '#065F46', dark: '#065F46' },
        surface: { light: '#ECFDF5', dark: '#022C22' },
        'surface-strong': { light: '#D1FAE5', dark: '#064E3B' },
        border: { light: '#A7F3D0', dark: '#065F46' },
        text: { light: '#047857', dark: '#A7F3D0' },
      },
      info: {
        solid: { light: '#2563EB', dark: '#2563EB' },
        'solid-hover': { light: '#1D4ED8', dark: '#1D4ED8' },
        surface: { light: '#EFF6FF', dark: '#172554' },
        'surface-strong': { light: '#DBEAFE', dark: '#1E3A8A' },
        border: { light: '#BFDBFE', dark: '#1E40AF' },
        text: { light: '#1D4ED8', dark: '#BFDBFE' },
      },
    }

    expect(css).toContain('--color-surface-base: #FFFFFF;')
    expect(css).toContain('--color-surface-base-dark: rgb(255 255 255 / 5%);')
    expect(css).toContain('--color-theme-bg: var(--color-bg-light);')
    expect(css).toContain('--color-theme-bg: var(--color-bg-dark);')
    expect(css).toContain('--color-theme-surface-base: var(--color-surface-base);')
    expect(css).toContain('--color-theme-surface-base: var(--color-surface-base-dark);')
    expect(dtcg.color['surface-base'].$value).toBe('#FFFFFF')
    expect(dtcg.color['surface-base-dark'].$value).toBe('rgb(255 255 255 / 5%)')
    expect(dtcg.theme.bg).toEqual({
      light: { $type: 'color', $value: '{color.bg-light}' },
      dark: { $type: 'color', $value: '{color.bg-dark}' },
    })
    expect(styles).toContain('--color-theme-status-danger-solid')
    expect(dtcg.color['status-on-solid'].$value).toBe('#FFFFFF')

    for (const [status, roles] of Object.entries(statuses)) {
      for (const [role, variants] of Object.entries(roles)) {
        const token = `status-${status}-${role}`
        const themeToken = `status-${status}-${role}`

        expect(css).toContain(`--color-${token}: ${variants.light};`)
        expect(css).toContain(`--color-${token}-dark: ${variants.dark};`)
        expect(css).toContain(`--color-theme-${themeToken}: var(--color-${token});`)
        expect(css).toContain(`--color-theme-${themeToken}: var(--color-${token}-dark);`)
        expect(dtcg.color[token].$value).toBe(variants.light)
        expect(dtcg.color[`${token}-dark`].$value).toBe(variants.dark)
        expect(dtcg.theme[themeToken]).toEqual({
          light: { $type: 'color', $value: `{color.${token}}` },
          dark: { $type: 'color', $value: `{color.${token}-dark}` },
        })
      }

      expect(contrastRatio(dtcg.color[`status-${status}-solid`].$value, dtcg.color['status-on-solid'].$value))
        .toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(dtcg.color[`status-${status}-text`].$value, dtcg.color[`status-${status}-surface`].$value))
        .toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(dtcg.color[`status-${status}-text`].$value, dtcg.color[`status-${status}-surface-strong`].$value))
        .toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(dtcg.color[`status-${status}-text-dark`].$value, dtcg.color[`status-${status}-surface-dark`].$value))
        .toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(dtcg.color[`status-${status}-text-dark`].$value, dtcg.color[`status-${status}-surface-strong-dark`].$value))
        .toBeGreaterThanOrEqual(4.5)
    }
  })

  it('ships the exact Jaune pion secondary brand accent in CSS and DTCG', () => {
    const css = readFileSync(resolve(uiDirectory, 'dist/tokens.css'), 'utf8')
    const dtcg = JSON.parse(readFileSync(resolve(uiDirectory, 'dist/tokens.dtcg.json'), 'utf8')) as {
      color: Record<string, { $value: string }>
    }

    expect(css).toContain('--color-brand-accent: #F5C842;')
    expect(dtcg.color['brand-accent'].$value).toBe('#F5C842')
  })

  it('ships the exact emphasis shadow token in CSS and DTCG', () => {
    const css = readFileSync(resolve(uiDirectory, 'dist/tokens.css'), 'utf8')
    const dtcg = JSON.parse(readFileSync(resolve(uiDirectory, 'dist/tokens.dtcg.json'), 'utf8')) as {
      shadow: Record<string, {
        $value: {
          offsetX: string
          offsetY: string
          blur: string
          spread: string
          color: string
        }
      }>
    }

    expect(css).toContain('--shadow-emphasis: 0 0 25px 0 rgba(0,0,0,0.25);')
    expect(dtcg.shadow.emphasis.$value).toEqual({
      offsetX: '0',
      offsetY: '0',
      blur: '25px',
      spread: '0',
      color: 'rgba(0,0,0,0.25)',
    })
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

  it('uses UI tokens for exact One and UI component values without changing their visual values', () => {
    const settings = readFileSync(resolve(process.cwd(), 'src/Settings.tsx'), 'utf8')
    const bottomSheet = readFileSync(resolve(process.cwd(), 'src/BottomSheet.tsx'), 'utf8')
    const miniHeaderCss = readFileSync(resolve(uiDirectory, 'src/mini-header.css'), 'utf8')
    const bottomNavCss = readFileSync(resolve(uiDirectory, 'src/bottom-nav.css'), 'utf8')
    const launcherCss = readFileSync(resolve(uiDirectory, 'src/launcher.css'), 'utf8')

    expect(settings).toContain('stroke="var(--color-brand-primary)"')
    expect(settings).toContain('focus:border-[var(--color-brand-primary)]')
    expect(settings).toContain('bg-[var(--color-brand-primary)]')
    expect(settings).toContain('hover:bg-[var(--color-brand-primary-hover)]')
    expect(bottomSheet).toContain('dark:bg-[var(--color-surface-glass-dark)]')
    expect(miniHeaderCss).toContain('color: var(--color-text-primary-dark);')
    expect(bottomNavCss).toContain('var(--color-text-primary-dark)')
    expect(launcherCss).toContain('var(--color-text-primary-dark)')

    expect(settings).toContain('bg-white/70 dark:bg-white/5')
    expect(bottomSheet).toContain('bg-white dark:bg-[var(--color-surface-glass-dark)]')
  })

  it('only whitelists dist, README and CHANGELOG for npm packaging', () => {
    const pkg = manifest('ui')

    expect(pkg.files).toEqual(['dist', 'README.md', 'CHANGELOG.md'])
  })

  it('keeps published changelogs for bridge and UI', () => {
    const uiChangelog = resolve(uiDirectory, 'CHANGELOG.md')
    const bridgeChangelog = resolve(bridgeDirectory, 'CHANGELOG.md')

    expect(existsSync(uiChangelog)).toBe(true)
    expect(existsSync(bridgeChangelog)).toBe(true)
    expect(readFileSync(uiChangelog, 'utf8')).toContain('## [0.5.0]')
    expect(readFileSync(uiChangelog, 'utf8')).toContain('surface-base')
    expect(readFileSync(uiChangelog, 'utf8')).toContain('status-danger')
    expect(readFileSync(uiChangelog, 'utf8')).toContain('showApps')
    expect(readFileSync(uiChangelog, 'utf8')).toContain('## [0.3.3]')
    expect(readFileSync(uiChangelog, 'utf8')).toContain('brand-accent')
    expect(readFileSync(uiChangelog, 'utf8')).toContain('## [0.3.2]')
    expect(readFileSync(uiChangelog, 'utf8')).toContain('shadow.emphasis')
    expect(readFileSync(uiChangelog, 'utf8')).toContain('## [0.3.0]')
    expect(readFileSync(uiChangelog, 'utf8')).toContain('surface-subtle')
    expect(readFileSync(bridgeChangelog, 'utf8')).toContain('## [0.1.0]')
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

    expect(pack.files.map((file) => file.path)).toContain('CHANGELOG.md')
    expect(pack.files.map((file) => file.path)).not.toContainEqual(expect.stringMatching(/^src\//))
  })

  it('includes the bridge changelog in its npm tarball', () => {
    const output = execFileSync('npm', [
      'pack', '--dry-run', '--json', '--ignore-scripts', '-w', '@loodi/bridge',
    ], {
      cwd: resolve(process.cwd(), '../..'),
      encoding: 'utf8',
      env: { ...process.env, npm_config_cache: '/private/tmp/loodi-ui-npm-cache' },
    })
    const [pack] = JSON.parse(output) as [{ files: Array<{ path: string }> }]

    expect(pack.files.map((file) => file.path)).toContain('CHANGELOG.md')
  })
})

import { describe, expect, it } from 'vitest'
import {
  applyLocalUrlOverrides,
  getAppsForEnvironment,
  getConfigEnvironment,
} from '../apps'

describe('module configuration', () => {
  it('maps Vite modes to their module configuration environment', () => {
    expect(getConfigEnvironment('development')).toBe('local')
    expect(getConfigEnvironment('android-emulator')).toBe('emulator')
    expect(getConfigEnvironment('ios-simulator')).toBe('ios-simulator')
    expect(getConfigEnvironment('recette')).toBe('recette')
    expect(getConfigEnvironment('production')).toBe('production')
    expect(getConfigEnvironment('unknown')).toBe('production')
  })

  it('uses the configuration dedicated to the selected environment', () => {
    const localUrls = Object.fromEntries(getAppsForEnvironment('development').map((app) => [app.id, app.url]))

    expect(localUrls).toMatchObject({
      'loodi-dev': 'https://dummy.loodi.test:4000',
      loodi: 'https://collec.loodi.test:4002',
      'loodi-mate': 'https://mate.loodi.test:4003',
      'loodi-mag': 'https://mag.loodi.test:4004',
      'loodi-places': 'https://places.loodi.test:4005',
      'loodi-fest': 'https://fest.loodi.test:4006',
      'loodi-sessions': 'https://sessions.loodi.test:4007',
    })
    expect(getAppsForEnvironment('android-emulator').find((app) => app.id === 'loodi-dev')?.url).toBe('https://10.0.2.2:4000')
    expect(getAppsForEnvironment('ios-simulator').find((app) => app.id === 'loodi-dev')?.url).toBe('https://localhost:4000')
    expect(getAppsForEnvironment('recette').find((app) => app.id === 'loodi')?.url).toBeNull()
    expect(getAppsForEnvironment('production').find((app) => app.id === 'loodi')?.url).toBe('https://loodi.vercel.app')
  })

  it('uses valid local overrides without changing the other module URLs', () => {
    const apps = getAppsForEnvironment('development')

    const resolved = applyLocalUrlOverrides(apps, {
      loodi: 'https://192.168.1.42:4173',
      'loodi-mate': 'not a URL',
    })

    expect(resolved.find((app) => app.id === 'loodi')?.url).toBe('https://192.168.1.42:4173')
    expect(resolved.find((app) => app.id === 'loodi-mate')?.url).toBe('https://mate.loodi.test:4003')
  })
})

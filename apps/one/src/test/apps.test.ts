import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BRIDGE_ALLOWED_ORIGINS,
  applyLocalUrlOverrides,
  getBridgeAllowedOrigins,
  getBridgeAllowedOriginsForApps,
  getAppsForEnvironment,
  getConfigEnvironment,
  getRuntimeApps,
  isLocalBuildForMode,
  isRemoteRegistryEnabled,
  loadLocalModuleUrls,
  saveLocalModuleUrls,
  REGISTRY_CACHE_KEY,
  REGISTRY_CACHE_MAX_AGE_MS,
  REMOTE_REGISTRY_URL,
  refreshRemoteRegistry,
} from '../apps'

const NOW = Date.UTC(2026, 6, 18)
const COLLEC_URL = 'https://loodi.vercel.app'

const acceptedManifest = {
  apps: [
    { id: 'loodi', name: 'collec', icon: '📚', url: COLLEC_URL, color: '#ca4a16' },
    { id: 'loodi-mate', name: 'Mate', icon: '🤖', url: null, color: '#2E8B57' },
  ],
}

function successfulResponse(body: unknown) {
  return { ok: true, json: vi.fn().mockResolvedValue(body) }
}

function createStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  } as Storage
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createStorage())
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('module configuration', () => {
  it('registers Friends across the local development environments', () => {
    expect(getAppsForEnvironment('development').find((app) => app.id === 'loodi-friends')).toMatchObject({
      name: 'Friends',
      icon: '/icons/loodi-friends.svg',
      color: '#D84A77',
      url: 'https://friends.loodi.test:4008',
    })
    expect(getAppsForEnvironment('android-emulator').find((app) => app.id === 'loodi-friends')?.url).toBe('https://10.0.2.2:4008')
    expect(getAppsForEnvironment('ios-simulator').find((app) => app.id === 'loodi-friends')?.url).toBe('https://localhost:4008')
    expect(getAppsForEnvironment('android-device').find((app) => app.id === 'loodi-friends')?.url).toBe('https://192.168.0.109:4008')
    expect(getAppsForEnvironment('ios-device').find((app) => app.id === 'loodi-friends')?.url).toBe('https://192.168.0.109:4008')
  })

  it('uses the accessible module palette for Mag and Sessions in every registry', () => {
    for (const mode of ['development', 'android-device', 'ios-device', 'recette', 'production']) {
      const apps = getAppsForEnvironment(mode)
      expect(apps.find((app) => app.id === 'loodi-mag')?.color).toBe('#3570A8')
      expect(apps.find((app) => app.id === 'loodi-sessions')?.color).toBe('#007C91')
    }
  })

  it('registers Friends in recette while keeping it absent from production', () => {
    expect(getAppsForEnvironment('recette').find((app) => app.id === 'loodi-friends')).toMatchObject({
      name: 'Friends',
      url: 'https://loodifriends.vercel.app',
    })
    expect(getAppsForEnvironment('production').find((app) => app.id === 'loodi-friends')).toBeUndefined()
  })

  it('allowlists the Friends origin in every local development environment', () => {
    expect(getBridgeAllowedOrigins('development')).toContain('https://friends.loodi.test:4008')
    expect(getBridgeAllowedOrigins('android-emulator')).toContain('https://10.0.2.2:4008')
    expect(getBridgeAllowedOrigins('ios-simulator')).toContain('https://localhost:4008')
    expect(getBridgeAllowedOrigins('android-device')).toContain('https://192.168.0.109:4008')
    expect(getBridgeAllowedOrigins('ios-device')).toContain('https://192.168.0.109:4008')
  })

  it('ships the Friends icon variants generated from the design asset', () => {
    const iconDir = resolve(process.cwd(), 'public/icons')
    const light = readFileSync(resolve(iconDir, 'loodi-friends.svg'), 'utf8')
    const dark = readFileSync(resolve(iconDir, 'loodi-friends-dark.svg'), 'utf8')

    expect(existsSync(resolve(iconDir, 'loodi-friends.svg'))).toBe(true)
    expect(existsSync(resolve(iconDir, 'loodi-friends-dark.svg'))).toBe(true)
    expect(light).toContain('fill="#D84A77"')
    expect(light).toContain('stroke="#D84A77"')
    expect(dark).toContain('fill="#D84A77"')
    expect(dark).toContain('fill="#FFFFFF"')
  })

  it('maps Vite modes to their module configuration environment', () => {
    expect(getConfigEnvironment('development')).toBe('local')
    expect(getConfigEnvironment('android-emulator')).toBe('emulator')
    expect(getConfigEnvironment('android-device')).toBe('android-device')
    expect(getConfigEnvironment('ios-simulator')).toBe('ios-simulator')
    expect(getConfigEnvironment('ios-device')).toBe('ios-device')
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
    expect(getAppsForEnvironment('android-device').find((app) => app.id === 'loodi')?.url).toBe('https://192.168.0.109:4002')
    expect(getAppsForEnvironment('ios-simulator').find((app) => app.id === 'loodi-dev')?.url).toBe('https://localhost:4000')
    expect(getAppsForEnvironment('ios-device').find((app) => app.id === 'loodi')?.url).toBe('https://192.168.0.109:4002')
    expect(getAppsForEnvironment('recette').find((app) => app.id === 'loodi')?.url).toBe(COLLEC_URL)
    expect(getAppsForEnvironment('production').find((app) => app.id === 'loodi')?.url).toBe(COLLEC_URL)
  })

  it('exposes an explicit bridge origin allowlist for every environment', () => {
    expect(getBridgeAllowedOrigins('development')).toEqual(BRIDGE_ALLOWED_ORIGINS.local)
    expect(getBridgeAllowedOrigins('android-emulator')).toEqual([
      'https://10.0.2.2:4000',
      'https://10.0.2.2:4002',
      'https://10.0.2.2:4008',
    ])
    expect(getBridgeAllowedOrigins('android-device')).toContain('https://192.168.0.109:4002')
    expect(getBridgeAllowedOrigins('ios-simulator')).toEqual([
      'https://localhost:4000',
      'https://localhost:4002',
      'https://localhost:4008',
    ])
    expect(getBridgeAllowedOrigins('ios-device')).toContain('https://192.168.0.109:4002')
    expect(getBridgeAllowedOrigins('recette')).toEqual([COLLEC_URL, 'https://loodifriends.vercel.app'])
    expect(getBridgeAllowedOrigins('production')).toEqual([COLLEC_URL])
    expect(Object.values(BRIDGE_ALLOWED_ORIGINS).flat()).not.toContain('*')
  })

  it('keeps the physical-device build compiled and hides local override support', () => {
    localStorage.setItem('loodi:localModuleUrls', JSON.stringify({
      loodi: 'https://10.0.2.2:4002',
    }))

    expect(loadLocalModuleUrls('android-device')).toEqual({})
    expect(saveLocalModuleUrls({ loodi: 'https://10.0.2.2:4002' }, 'android-device')).toEqual({})
    expect(localStorage.getItem('loodi:localModuleUrls')).toContain('10.0.2.2:4002')
    expect(getRuntimeApps(undefined, 'android-device')).toEqual(getAppsForEnvironment('android-device'))
    expect(isLocalBuildForMode('android-device')).toBe(false)
    expect(isRemoteRegistryEnabled('android-device')).toBe(false)
    expect(loadLocalModuleUrls('ios-device')).toEqual({})
    expect(saveLocalModuleUrls({ loodi: 'https://10.0.2.2:4002' }, 'ios-device')).toEqual({})
    expect(getRuntimeApps(undefined, 'ios-device')).toEqual(getAppsForEnvironment('ios-device'))
    expect(isLocalBuildForMode('ios-device')).toBe(false)
    expect(isRemoteRegistryEnabled('ios-device')).toBe(false)
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

  it('starts from the compiled registry when no remote cache exists', () => {
    const apps = getRuntimeApps({}, 'production', NOW)

    expect(apps).toEqual(getAppsForEnvironment('production'))
  })

  it('uses only a valid, fresh remote registry cache on the next launch', async () => {
    const fetchManifest = vi.fn().mockResolvedValue(successfulResponse(acceptedManifest))
    const firstLaunchApps = getRuntimeApps({}, 'production', NOW)

    await expect(refreshRemoteRegistry(fetchManifest, NOW)).resolves.toBe(true)

    expect(fetchManifest).toHaveBeenCalledWith(REMOTE_REGISTRY_URL, { cache: 'no-store' })
    expect(firstLaunchApps).toEqual(getAppsForEnvironment('production'))
    expect(getRuntimeApps({}, 'production', NOW + 1)).toEqual(acceptedManifest.apps)
  })

  it('falls back to the compiled registry when the cached manifest is expired', () => {
    localStorage.setItem(REGISTRY_CACHE_KEY, JSON.stringify({
      version: 1,
      fetchedAt: NOW - REGISTRY_CACHE_MAX_AGE_MS,
      apps: acceptedManifest.apps,
    }))

    expect(getRuntimeApps({}, 'production', NOW)).toEqual(getAppsForEnvironment('production'))
  })

  it('falls back to the compiled registry and discards an invalid cached manifest', () => {
    localStorage.setItem(REGISTRY_CACHE_KEY, JSON.stringify({
      version: 1,
      fetchedAt: NOW,
      apps: [{ ...acceptedManifest.apps[0], url: 'http://untrusted.example/collec' }],
    }))

    expect(getRuntimeApps({}, 'production', NOW)).toEqual(getAppsForEnvironment('production'))
    expect(localStorage.getItem(REGISTRY_CACHE_KEY)).toBeNull()
  })

  it('does not cache an invalid manifest and retains the compiled fallback', async () => {
    const fetchManifest = vi.fn().mockResolvedValue(successfulResponse({ apps: [{ id: 'loodi' }] }))

    await expect(refreshRemoteRegistry(fetchManifest, NOW)).resolves.toBe(false)

    expect(localStorage.getItem(REGISTRY_CACHE_KEY)).toBeNull()
    expect(getRuntimeApps({}, 'production', NOW)).toEqual(getAppsForEnvironment('production'))
  })

  it('keeps the compiled fallback when the network request fails', async () => {
    const fetchManifest = vi.fn().mockRejectedValue(new Error('offline'))

    await expect(refreshRemoteRegistry(fetchManifest, NOW)).resolves.toBe(false)

    expect(getRuntimeApps({}, 'production', NOW)).toEqual(getAppsForEnvironment('production'))
  })

  it('accepts a remote HTTPS module from the trusted registry', async () => {
    const fetchManifest = vi.fn().mockResolvedValue(successfulResponse({
      apps: [{ ...acceptedManifest.apps[0], url: 'https://loodi-mate.vercel.app/' }],
    }))

    await expect(refreshRemoteRegistry(fetchManifest, NOW)).resolves.toBe(true)

    expect(getRuntimeApps({}, 'production', NOW + 1)[0]?.url).toBe('https://loodi-mate.vercel.app/')
  })

  it('rejects a remote module URL served over HTTP', async () => {
    const fetchManifest = vi.fn().mockResolvedValue(successfulResponse({
      apps: [{ ...acceptedManifest.apps[0], url: 'http://loodi-mate.vercel.app/' }],
    }))

    await expect(refreshRemoteRegistry(fetchManifest, NOW)).resolves.toBe(false)

    expect(localStorage.getItem(REGISTRY_CACHE_KEY)).toBeNull()
  })

  it('derives strict bridge origins from the cached remote registry in production only', async () => {
    const fetchManifest = vi.fn().mockResolvedValue(successfulResponse({
      apps: [
        ...acceptedManifest.apps,
        { id: 'loodi-mag', name: 'Mag', icon: '📰', url: 'https://loodi-mag.vercel.app/', color: '#3570A8' },
      ],
    }))

    await expect(refreshRemoteRegistry(fetchManifest, NOW)).resolves.toBe(true)

    expect(getBridgeAllowedOriginsForApps(getRuntimeApps({}, 'production', NOW + 1))).toEqual([
      'https://loodi-mag.vercel.app',
      'https://loodi.vercel.app',
    ])
  })

  it('keeps local module URLs exclusive to development builds even when a remote cache exists', async () => {
    await refreshRemoteRegistry(vi.fn().mockResolvedValue(successfulResponse(acceptedManifest)), NOW)

    expect(getRuntimeApps({}, 'development', NOW + 1).find((app) => app.id === 'loodi')?.url)
      .toBe('https://collec.loodi.test:4002')
  })
})

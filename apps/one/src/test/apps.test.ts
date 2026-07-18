import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BRIDGE_ALLOWED_ORIGINS,
  applyLocalUrlOverrides,
  getBridgeAllowedOrigins,
  getAppsForEnvironment,
  getConfigEnvironment,
  getRuntimeApps,
  REGISTRY_CACHE_KEY,
  REGISTRY_CACHE_MAX_AGE_MS,
  REMOTE_REGISTRY_URL,
  refreshRemoteRegistry,
} from '../apps'

const NOW = Date.UTC(2026, 6, 18)

const acceptedManifest = {
  apps: [
    { id: 'loodi', name: 'collec', icon: '📚', url: 'https://loodi.vercel.app', color: '#ca4a16' },
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

  it('exposes an explicit bridge origin allowlist for every environment', () => {
    expect(getBridgeAllowedOrigins('development')).toEqual(BRIDGE_ALLOWED_ORIGINS.local)
    expect(getBridgeAllowedOrigins('android-emulator')).toEqual([
      'https://10.0.2.2:4000',
      'https://10.0.2.2:4002',
    ])
    expect(getBridgeAllowedOrigins('ios-simulator')).toEqual([
      'https://localhost:4000',
      'https://localhost:4002',
    ])
    expect(getBridgeAllowedOrigins('recette')).toEqual([])
    expect(getBridgeAllowedOrigins('production')).toEqual(['https://loodi.vercel.app'])
    expect(Object.values(BRIDGE_ALLOWED_ORIGINS).flat()).not.toContain('*')
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

    expect(fetchManifest).toHaveBeenCalledWith(REMOTE_REGISTRY_URL)
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
      apps: [{ ...acceptedManifest.apps[0], url: 'https://untrusted.example/collec' }],
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

  it('rejects a remote module URL outside the embedded origin allowlist', async () => {
    const fetchManifest = vi.fn().mockResolvedValue(successfulResponse({
      apps: [{ ...acceptedManifest.apps[0], url: 'https://untrusted.example/collec' }],
    }))

    await expect(refreshRemoteRegistry(fetchManifest, NOW)).resolves.toBe(false)

    expect(localStorage.getItem(REGISTRY_CACHE_KEY)).toBeNull()
    expect(getRuntimeApps({}, 'production', NOW)).toEqual(getAppsForEnvironment('production'))
  })

  it('rejects a development-only module origin from a remote manifest', async () => {
    const fetchManifest = vi.fn().mockResolvedValue(successfulResponse({
      apps: [{ ...acceptedManifest.apps[0], url: 'https://collec.loodi.test:4002' }],
    }))

    await expect(refreshRemoteRegistry(fetchManifest, NOW)).resolves.toBe(false)

    expect(localStorage.getItem(REGISTRY_CACHE_KEY)).toBeNull()
  })

  it('keeps local module URLs exclusive to development builds even when a remote cache exists', async () => {
    await refreshRemoteRegistry(vi.fn().mockResolvedValue(successfulResponse(acceptedManifest)), NOW)

    expect(getRuntimeApps({}, 'development', NOW + 1).find((app) => app.id === 'loodi')?.url)
      .toBe('https://collec.loodi.test:4002')
  })
})

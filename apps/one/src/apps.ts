import localApps from './config/apps.local.json'
import emulatorApps from './config/apps.emulator.json'
import iosSimulatorApps from './config/apps.ios-simulator.json'
import recetteApps from './config/apps.recette.json'
import productionApps from './config/apps.production.json'

export interface AppEntry {
  id: string
  name: string
  icon: string
  url: string | null
  color: string
}

export type ConfigEnvironment = 'local' | 'emulator' | 'ios-simulator' | 'recette' | 'production'
export type LocalModuleUrls = Record<string, string>
export type RegistryFetcher = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>

const LOCAL_MODULE_URLS_KEY = 'loodi:localModuleUrls'
export const REGISTRY_CACHE_KEY = 'loodi:remoteRegistry'
export const REGISTRY_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
export const REMOTE_REGISTRY_URL = 'https://battlebenny.github.io/loodione/config.json'

const appsByEnvironment: Record<ConfigEnvironment, AppEntry[]> = {
  local: localApps,
  emulator: emulatorApps,
  'ios-simulator': iosSimulatorApps,
  recette: recetteApps,
  production: productionApps,
}

export function getConfigEnvironment(mode: string): ConfigEnvironment {
  if (mode === 'development' || mode === 'local' || mode === 'test') return 'local'
  if (mode === 'android-emulator') return 'emulator'
  if (mode === 'ios-simulator') return 'ios-simulator'
  if (mode === 'recette') return 'recette'
  return 'production'
}

export const configEnvironment = getConfigEnvironment(import.meta.env.MODE)
function isLocalEnvironment(environment: ConfigEnvironment): boolean {
  return environment === 'local' || environment === 'emulator' || environment === 'ios-simulator'
}

export const isLocalBuild = isLocalEnvironment(configEnvironment)

function moduleOrigin(value: string | null): string | null {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function moduleOrigins(apps: readonly AppEntry[]): string[] {
  return [...new Set(apps.flatMap((app) => {
    const origin = moduleOrigin(app.url)
    return origin ? [origin] : []
  }))].sort()
}

/**
 * Exact module origins compiled for every shell environment. An origin entered
 * through the development override UI never expands this list implicitly.
 */
export const BRIDGE_ALLOWED_ORIGINS: Readonly<Record<ConfigEnvironment, readonly string[]>> = {
  local: moduleOrigins(localApps),
  emulator: moduleOrigins(emulatorApps),
  'ios-simulator': moduleOrigins(iosSimulatorApps),
  recette: moduleOrigins(recetteApps),
  production: moduleOrigins(productionApps),
}

export function getBridgeAllowedOrigins(mode: string): readonly string[] {
  return BRIDGE_ALLOWED_ORIGINS[getConfigEnvironment(mode)]
}

/**
 * Production origins compiled into One; development-only origins are excluded
 * so a remote registry cannot make a local module reachable in production.
 */
export const MODULE_ORIGIN_ALLOWLIST = [...new Set(
  productionApps.flatMap((app) => {
    const origin = moduleOrigin(app.url)
    return origin ? [origin] : []
  }),
)].sort()

const allowedModuleOrigins = new Set(MODULE_ORIGIN_ALLOWLIST)

export function getAppsForEnvironment(mode: string): AppEntry[] {
  return appsByEnvironment[getConfigEnvironment(mode)].map((app) => ({ ...app }))
}

function isModuleUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseRemoteRegistry(value: unknown): AppEntry[] | null {
  const records = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.apps)
      ? value.apps
      : isRecord(value) && Array.isArray(value.modules)
        ? value.modules
        : null
  if (!records) return null

  const ids = new Set<string>()
  const apps: AppEntry[] = []
  for (const record of records) {
    if (!isRecord(record)
      || typeof record.id !== 'string' || record.id.trim() === '' || ids.has(record.id)
      || typeof record.name !== 'string' || record.name.trim() === ''
      || typeof record.icon !== 'string' || record.icon.trim() === ''
      || typeof record.color !== 'string' || record.color.trim() === ''
      || (record.url !== null && typeof record.url !== 'string')) return null

    if (typeof record.url === 'string') {
      const origin = moduleOrigin(record.url)
      if (!origin || new URL(record.url).protocol !== 'https:' || !allowedModuleOrigins.has(origin)) return null
    }

    ids.add(record.id)
    apps.push({
      id: record.id,
      name: record.name,
      icon: record.icon,
      url: record.url as string | null,
      color: record.color,
    })
  }
  return apps
}

function removeRemoteRegistryCache(): void {
  try { localStorage.removeItem(REGISTRY_CACHE_KEY) } catch { /* noop */ }
}

/** Returns a validated cache only while it is less than 30 days old. */
export function loadRemoteRegistryCache(now = Date.now()): AppEntry[] | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(REGISTRY_CACHE_KEY) ?? 'null')
    if (!isRecord(value) || value.version !== 1 || typeof value.fetchedAt !== 'number') {
      removeRemoteRegistryCache()
      return null
    }
    const age = now - value.fetchedAt
    if (!Number.isFinite(age) || age < 0 || age >= REGISTRY_CACHE_MAX_AGE_MS) {
      removeRemoteRegistryCache()
      return null
    }
    const apps = parseRemoteRegistry({ apps: value.apps })
    if (!apps) {
      removeRemoteRegistryCache()
      return null
    }
    return apps
  } catch {
    removeRemoteRegistryCache()
    return null
  }
}

/** Fetches and validates the next registry without changing the running shell. */
export async function refreshRemoteRegistry(
  fetcher: RegistryFetcher = (url) => fetch(url),
  now = Date.now(),
): Promise<boolean> {
  try {
    const response = await fetcher(REMOTE_REGISTRY_URL)
    if (!response.ok) return false
    const apps = parseRemoteRegistry(await response.json())
    if (!apps) return false
    localStorage.setItem(REGISTRY_CACHE_KEY, JSON.stringify({ version: 1, fetchedAt: now, apps }))
    return true
  } catch {
    return false
  }
}

export function isRemoteRegistryEnabled(mode: string): boolean {
  return mode !== 'test' && !isLocalEnvironment(getConfigEnvironment(mode))
}

export function applyLocalUrlOverrides(apps: AppEntry[], overrides: LocalModuleUrls): AppEntry[] {
  return apps.map((app) => ({
    ...app,
    url: isModuleUrl(overrides[app.id]) ? overrides[app.id] : app.url,
  }))
}

export function loadLocalModuleUrls(): LocalModuleUrls {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(LOCAL_MODULE_URLS_KEY) ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(Object.entries(value).filter(([, url]) => isModuleUrl(url)))
  } catch {
    return {}
  }
}

export function saveLocalModuleUrls(urls: LocalModuleUrls) {
  const validUrls = Object.fromEntries(Object.entries(urls).filter(([, url]) => isModuleUrl(url)))
  try { localStorage.setItem(LOCAL_MODULE_URLS_KEY, JSON.stringify(validUrls)) } catch { /* noop */ }
  return validUrls
}

export function getRuntimeApps(
  overrides = loadLocalModuleUrls(),
  mode = import.meta.env.MODE,
  now = Date.now(),
): AppEntry[] {
  const environment = getConfigEnvironment(mode)
  const apps = getAppsForEnvironment(mode)
  if (isLocalEnvironment(environment)) {
    return applyLocalUrlOverrides(apps, overrides)
  }
  return isRemoteRegistryEnabled(mode) ? loadRemoteRegistryCache(now) ?? apps : apps
}

export const APPS = getRuntimeApps()

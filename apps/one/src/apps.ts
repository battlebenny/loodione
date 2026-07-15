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

const LOCAL_MODULE_URLS_KEY = 'loodi:localModuleUrls'

const appsByEnvironment: Record<ConfigEnvironment, AppEntry[]> = {
  local: localApps,
  emulator: emulatorApps,
  'ios-simulator': iosSimulatorApps,
  recette: recetteApps,
  production: productionApps,
}

export function getConfigEnvironment(mode: string): ConfigEnvironment {
  if (mode === 'development' || mode === 'local') return 'local'
  if (mode === 'android-emulator') return 'emulator'
  if (mode === 'ios-simulator') return 'ios-simulator'
  if (mode === 'recette') return 'recette'
  return 'production'
}

export const configEnvironment = getConfigEnvironment(import.meta.env.MODE)
export const isLocalBuild = configEnvironment === 'local' || configEnvironment === 'emulator' || configEnvironment === 'ios-simulator'

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

export function getRuntimeApps(overrides = loadLocalModuleUrls()): AppEntry[] {
  const apps = getAppsForEnvironment(import.meta.env.MODE)
  return isLocalBuild ? applyLocalUrlOverrides(apps, overrides) : apps
}

export const APPS = getRuntimeApps()

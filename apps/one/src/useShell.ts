import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import {
  applyLocalUrlOverrides,
  getBridgeAllowedOriginsForApps,
  getAppsForEnvironment,
  getRuntimeApps,
  isLocalBuild,
  isRemoteRegistryEnabled,
  loadLocalModuleUrls,
  refreshRemoteRegistry,
  saveLocalModuleUrls,
  type LocalModuleUrls,
} from './apps'
import { normalizeThemeMode, resolveTheme } from './theme'
import { BridgeServer } from './BridgeServer'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { installNavigationRuntime, type NavigationPlatform } from './navigation'
import type { ThemeMode } from './theme'
import type { HeaderAction, HeaderOptions, SharedPreferences, SharedPreferencesUpdate } from '@loodi/bridge'
import type { Tab } from '@loodi/ui/bottom-nav'
import type { AppEntry } from './apps'

export interface ShellState {
  activeAppId: string
  tabs: Tab[]
  headerActions: HeaderAction[]
  headerOptions: HeaderOptions
  activeTab: string | undefined
  apps: AppEntry[]
  launcherOpen: boolean
  settingsOpen: boolean
  history: string[]
}

function loadAppId(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

function saveAppId(key: string, id: string) {
  try { localStorage.setItem(key, id) } catch { /* noop */ }
}

function loadThemeMode(): ThemeMode {
  try { return normalizeThemeMode(localStorage.getItem('loodi:theme')) } catch { return 'system' }
}

const LS_LAST = 'loodi:lastApp'
const LS_FAV = 'loodi:favApp'

export function registerRenderedModules(
  bridge: Pick<BridgeServer, 'registerModule'>,
  root: ParentNode = document,
): void {
  root.querySelectorAll<HTMLIFrameElement>('iframe[data-app]').forEach((iframe) => {
    const appId = iframe.dataset.app
    if (appId) bridge.registerModule(appId, iframe)
  })
}

export function getInitialAppId(
  apps: readonly AppEntry[],
  favoriteAppId: string | null | undefined,
  lastAppId: string | null | undefined,
): string {
  const availableIds = new Set(apps.filter((app) => app.url).map((app) => app.id))
  return [favoriteAppId, lastAppId, 'loodi'].find((id): id is string => Boolean(id && availableIds.has(id)))
    ?? apps.find((app) => app.url)?.id
    ?? 'loodi'
}

export function getModuleTabs(tabsByApp: ReadonlyMap<string, Tab[]>, appId: string): Tab[] {
  return tabsByApp.get(appId) ?? []
}

export function getModuleHeaderOptions(
  optionsByApp: ReadonlyMap<string, HeaderOptions>,
  appId: string,
): HeaderOptions {
  return optionsByApp.get(appId) ?? { hideActions: false, canGoBack: false }
}

export function getActiveTabForPath(path: string): string {
  if (path.startsWith('/catalog') || path.startsWith('/game/')) return 'catalog'
  if (path.startsWith('/scanner')) return 'scanner'
  if (path.startsWith('/loans')) return 'loans'
  return 'home'
}

export function useShell() {
  const [localModuleUrls, setLocalModuleUrlsState] = useState<LocalModuleUrls>(() => loadLocalModuleUrls())
  const [readyAppIds, setReadyAppIds] = useState<ReadonlySet<string>>(() => new Set())
  const [state, setState] = useState<ShellState>(() => {
    const fav = loadAppId(LS_FAV, '')
    const last = loadAppId(LS_LAST, 'loodi')
    const apps = getRuntimeApps()
    return {
      activeAppId: getInitialAppId(apps, fav, last),
      tabs: [],
      headerActions: [],
      headerOptions: { hideActions: false, canGoBack: false },
      activeTab: undefined,
      apps,
      launcherOpen: false,
      settingsOpen: false,
      history: [],
    }
  })

  const [themeMode, setThemeMode] = useState<ThemeMode>(loadThemeMode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => resolveTheme(loadThemeMode()))
  const sharedPreferencesRef = useRef<SharedPreferences>({
    themeMode: loadThemeMode(),
    resolvedTheme: resolveTheme(loadThemeMode()),
    revision: 0,
  })
  const updateSharedPreferencesSnapshot = useCallback((nextThemeMode: ThemeMode, nextTheme: 'dark' | 'light') => {
    const current = sharedPreferencesRef.current
    if (current.themeMode === nextThemeMode && current.resolvedTheme === nextTheme) return current
    const next = { themeMode: nextThemeMode, resolvedTheme: nextTheme, revision: current.revision + 1 }
    sharedPreferencesRef.current = next
    return next
  }, [])

  useEffect(() => {
    try { localStorage.setItem('loodi:theme', themeMode) } catch { /* noop */ }
    if (themeMode !== 'system') { setTheme(themeMode); return }
    setTheme(resolveTheme('system'))
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setTheme(resolveTheme('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeMode])

  // The remote registry is stored for the following launch only: it must never
  // delay startup or replace the persistent module iframes while they are live.
  useEffect(() => {
    if (!isRemoteRegistryEnabled(import.meta.env.MODE)) return
    void refreshRemoteRegistry()
  }, [])

  const themeRef = useRef(theme)
  useEffect(() => { themeRef.current = theme }, [theme])

  const [openOverlayAppIds, setOpenOverlayAppIds] = useState<ReadonlySet<string>>(() => new Set())
  const [scrollY, setScrollY] = useState(0)
  const lastBridgeScroll = useRef(0)

  const bridgeRef = useRef<BridgeServer | null>(null)
  const pendingIframes = useRef<Map<string, HTMLIFrameElement>>(new Map())
  const tabsByApp = useRef<Map<string, Tab[]>>(new Map())
  const headerActionsByApp = useRef<Map<string, HeaderAction[]>>(new Map())
  const headerOptionsByApp = useRef<Map<string, HeaderOptions>>(new Map())
  const bridgeAllowedOrigins = getBridgeAllowedOriginsForApps(state.apps)
  const settingsOpenTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clearSettingsOpenTimeout = useCallback(() => {
    if (settingsOpenTimeout.current !== undefined) {
      clearTimeout(settingsOpenTimeout.current)
      settingsOpenTimeout.current = undefined
    }
  }, [])

  const showOneSettings = useCallback(() => {
    clearSettingsOpenTimeout()
    setState((s) => {
      if (!s.settingsOpen) history.pushState({ settings: true }, '')
      return { ...s, settingsOpen: true }
    })
  }, [clearSettingsOpenTimeout])

  const HEADER_H = 52
  const scrollProgress = Math.min(scrollY / (HEADER_H * 1.5), 1)
  const overlayActive = openOverlayAppIds.has(state.activeAppId)

  useEffect(() => {
    const bridge = new BridgeServer({
      onReady: (appId) => {
        setReadyAppIds((ids) => {
          if (ids.has(appId)) return ids
          return new Set(ids).add(appId)
        })
        bridge.sendThemeChange(appId, themeRef.current)
        bridge.sendSharedPreferencesChange(appId, sharedPreferencesRef.current)
      },
      onBadgeCount: (id, count) => console.log('[Loodi] badge', id, count),
      onError: (id, code, rec) => console.error('[Loodi] error', id, code, rec),
      onTabsChange: (appId, tabs) => {
        tabsByApp.current.set(appId, tabs)
        setState((s) => {
          if (s.activeAppId !== appId) return s
          return {
            ...s,
            tabs,
            activeTab: s.activeTab ?? tabs[0]?.id,
          }
        })
      },
      onHeaderActionsChange: (appId, headerActions) => {
        headerActionsByApp.current.set(appId, headerActions)
        setState((s) => s.activeAppId === appId ? { ...s, headerActions } : s)
      },
      onHeaderOptionsChange: (appId, headerOptions) => {
        headerOptionsByApp.current.set(appId, headerOptions)
        setState((s) => s.activeAppId === appId ? { ...s, headerOptions } : s)
      },
      onNavigate: (appId, path) => {
        setState((s) => s.activeAppId === appId
          ? { ...s, activeTab: getActiveTabForPath(path) }
          : s)
      },
      onOverlayChange: (appId, visible) => {
        setOpenOverlayAppIds((ids) => {
          if (ids.has(appId) === visible) return ids
          const next = new Set(ids)
          if (visible) next.add(appId)
          else next.delete(appId)
          return next
        })
      },
      onScroll: (_id, y) => { lastBridgeScroll.current = Date.now(); setScrollY(y) },
      onRequestOpenApp: (_caller, id) => activateApp(id),
      onRequestCloseApp: (appId) => {
        tabsByApp.current.delete(appId)
        headerActionsByApp.current.delete(appId)
        headerOptionsByApp.current.delete(appId)
        setOpenOverlayAppIds((ids) => {
          if (!ids.has(appId)) return ids
          const next = new Set(ids)
          next.delete(appId)
          return next
        })
        goBack()
      },
      onRequestShowSwitcher: toggleLauncher,
      onSettingsCapabilityChange: () => undefined,
      onSettingsOpenResult: (_appId, opened) => {
        clearSettingsOpenTimeout()
        if (!opened) showOneSettings()
      },
      onRequestSharedPreferences: () => sharedPreferencesRef.current,
      onRequestSharedPreferencesUpdate: (_appId, update: SharedPreferencesUpdate) => {
        const nextThemeMode = normalizeThemeMode(update.themeMode)
        const next = updateSharedPreferencesSnapshot(nextThemeMode, resolveTheme(nextThemeMode))
        setThemeMode(nextThemeMode)
        return next
      },
      onRequestShowShellSettings: showOneSettings,
    }, {
      security: {
        mode: 'strict',
        allowedOrigins: bridgeAllowedOrigins,
      },
    })
    bridgeRef.current = bridge
    pendingIframes.current.forEach((el, appId) => bridge.registerModule(appId, el))
    pendingIframes.current.clear()
    registerRenderedModules(bridge)
    return () => bridge.destroy()
  }, [])

  // Apply the theme to One, then notify registered modules through the strict
  // bridge so every postMessage uses the iframe's exact configured origin.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const preferences = updateSharedPreferencesSnapshot(themeMode, theme)
    state.apps.forEach((app) => {
      bridgeRef.current?.sendThemeChange(app.id, theme)
      bridgeRef.current?.sendSharedPreferencesChange(app.id, preferences)
    })
  }, [state.apps, theme, themeMode, updateSharedPreferencesSnapshot])

  // Wheel fallback for iframes without bridge scroll support
  useEffect(() => {
    const onWheel = ((e: Event) => {
      if (Date.now() - lastBridgeScroll.current < 100) return
      const we = e as WheelEvent
      setScrollY(prev => {
        const next = prev + we.deltaY * 0.15
        return Math.max(0, Math.min(HEADER_H * 1.5, next))
      })
    }) as EventListener
    const el = document.getElementById('module-container')
    if (el) el.addEventListener('wheel', onWheel, { passive: true })
    return () => { if (el) el.removeEventListener('wheel', onWheel) }
  }, [])

  const registerIframe = useCallback((appId: string, el: HTMLIFrameElement | null) => {
    if (el) {
      if (bridgeRef.current) bridgeRef.current.registerModule(appId, el)
      else pendingIframes.current.set(appId, el)
    } else {
      const hadPendingIframe = pendingIframes.current.delete(appId)
      const hadRegisteredModule = bridgeRef.current?.getModuleInfo(appId) !== undefined
      const hadTabs = tabsByApp.current.delete(appId)
      const hadHeaderActions = headerActionsByApp.current.delete(appId)
      const hadHeaderOptions = headerOptionsByApp.current.delete(appId)
      setOpenOverlayAppIds((ids) => {
        if (!ids.has(appId)) return ids
        const next = new Set(ids)
        next.delete(appId)
        return next
      })

      if (!hadPendingIframe && !hadRegisteredModule && !hadTabs && !hadHeaderActions && !hadHeaderOptions) return

      bridgeRef.current?.unregisterModule(appId)
      setState((s) => s.activeAppId === appId
        && (s.tabs.length > 0 || s.headerActions.length > 0 || s.headerOptions.hideActions === true || s.headerOptions.canGoBack === true)
        ? { ...s, tabs: [], headerActions: [], headerOptions: { hideActions: false, canGoBack: false } }
        : s)
    }
  }, [])

  const getApp = useCallback((id: string) => state.apps.find((a) => a.id === id) ?? null, [state.apps])

  const lastUsedAppId = useRef(loadAppId(LS_LAST, 'loodi'))

  const activateApp = useCallback((id: string) => {
    const app = getApp(id)
    if (!app || !app.url) return
    lastUsedAppId.current = id
    saveAppId(LS_LAST, id)
    setState((s) => ({
      ...s,
      activeAppId: id,
      tabs: getModuleTabs(tabsByApp.current, app.id),
      headerActions: headerActionsByApp.current.get(app.id) ?? [],
      headerOptions: getModuleHeaderOptions(headerOptionsByApp.current, app.id),
      activeTab: getModuleTabs(tabsByApp.current, app.id)[0]?.id,
      launcherOpen: false,
      settingsOpen: false,
      history: id === 'loodi' ? [] : [...s.history, id],
    }))
  }, [getApp])

  const [favoriteAppId, setFavoriteAppIdState] = useState<string | null>(() => loadAppId(LS_FAV, '') || null)
  const setFavoriteAppId = useCallback((id: string | null) => {
    setFavoriteAppIdState(id)
    if (id) saveAppId(LS_FAV, id)
    else try { localStorage.removeItem(LS_FAV) } catch { /* noop */ }
  }, [])

  const toggleLauncher = useCallback(() => {
    setState((s) => ({ ...s, launcherOpen: !s.launcherOpen }))
  }, [])

  // Intercept browser back when Settings is open
  useEffect(() => {
    const handler = () => {
      setState((s) => {
        if (!s.settingsOpen) return s
        return { ...s, settingsOpen: false }
      })
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const toggleSettings = useCallback(() => {
    if (state.settingsOpen) {
      clearSettingsOpenTimeout()
      setState((s) => ({ ...s, settingsOpen: false }))
      return
    }

    const bridge = bridgeRef.current
    const supportsEmbeddedSettings = bridge?.getModuleInfo(state.activeAppId)?.supportsEmbeddedSettings === true
    if (!bridge || !supportsEmbeddedSettings) {
      showOneSettings()
      return
    }

    clearSettingsOpenTimeout()
    bridge.sendSettingsOpen(state.activeAppId)
    settingsOpenTimeout.current = setTimeout(showOneSettings, 600)
  }, [clearSettingsOpenTimeout, showOneSettings, state.activeAppId, state.settingsOpen])

  const goBack = useCallback(() => {
    setState((s) => {
      if (s.settingsOpen) return { ...s, settingsOpen: false }
      if (s.activeAppId === 'loodi') return s
      return {
        ...s,
        activeAppId: 'loodi',
        tabs: getModuleTabs(tabsByApp.current, 'loodi'),
        headerActions: headerActionsByApp.current.get('loodi') ?? [],
        headerOptions: getModuleHeaderOptions(headerOptionsByApp.current, 'loodi'),
        activeTab: undefined,
        history: [],
      }
    })
  }, [])

  const setTabs = useCallback((tabs: Tab[]) => {
    setState((s) => ({
      ...s,
      tabs,
      activeTab: s.activeTab ?? (tabs.length > 0 ? tabs[0].id : undefined),
    }))
  }, [])

  const setActiveTab = useCallback((tabId: string) => {
    setState((s) => ({ ...s, activeTab: tabId }))
  }, [])

  const sendHeaderAction = useCallback((id: string) => {
    bridgeRef.current?.sendHeaderAction(state.activeAppId, id)
  }, [state.activeAppId])

  const sendBack = useCallback(() => {
    bridgeRef.current?.sendBack(state.activeAppId)
  }, [state.activeAppId])

  const sendTabTap = useCallback((tabId: string) => {
    bridgeRef.current?.sendTabTap(state.activeAppId, tabId)
  }, [state.activeAppId])

  const requestNavigation = useCallback(async (direction: 'back' | 'forward', source: 'gesture' | 'system') => {
    if (direction === 'back' && state.settingsOpen) {
      clearSettingsOpenTimeout()
      setState((s) => ({ ...s, settingsOpen: false }))
      return true
    }
    const bridge = bridgeRef.current
    if (!bridge) return false
    return bridge.requestNavigation(state.activeAppId, direction, source)
  }, [clearSettingsOpenTimeout, state.activeAppId, state.settingsOpen])

  useEffect(() => {
    const rawPlatform = Capacitor.getPlatform()
    const platform: NavigationPlatform = rawPlatform === 'android' || rawPlatform === 'ios' ? rawPlatform : 'web'
    const navigationApp = CapacitorApp as {
      addListener: (event: 'backButton', handler: () => void) => Promise<{ remove: () => Promise<void> }> | { remove: () => Promise<void> }
    }
    return installNavigationRuntime(
      platform,
      requestNavigation,
      () => CapacitorApp.exitApp(),
      navigationApp,
    )
  }, [requestNavigation])

  const setLocalModuleUrls = useCallback((urls: LocalModuleUrls) => {
    const validUrls = saveLocalModuleUrls(urls)
    setLocalModuleUrlsState(validUrls)
    if (!isLocalBuild) return
    setState((s) => ({
      ...s,
      apps: applyLocalUrlOverrides(getAppsForEnvironment(import.meta.env.MODE), validUrls),
    }))
  }, [])

  return {
    state,
    theme,
    themeMode,
    setThemeMode,
    activateApp,
    lastUsedAppId,
    favoriteAppId,
    setFavoriteAppId,
    toggleLauncher,
    toggleSettings,
    goBack,
    setTabs,
    setActiveTab,
    registerIframe,
    overlayActive,
    scrollProgress,
    isLocalBuild,
    localModuleUrls,
    setLocalModuleUrls,
    readyAppIds,
    sendHeaderAction,
    sendBack,
    sendTabTap,
    requestNavigation,
  }
}

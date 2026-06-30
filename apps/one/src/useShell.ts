import { useState, useEffect, useCallback } from 'react'
import { APPS, fetchAppsFromConfig } from './apps'
import { resolveTheme } from './theme'
import type { ThemeMode } from './theme'
import type { Tab } from '@loodi/ui'
import type { AppEntry } from './apps'

export interface ShellState {
  activeAppId: string
  tabs: Tab[]
  activeTab: string | undefined
  apps: AppEntry[]
  launcherOpen: boolean
  settingsOpen: boolean
  history: string[]
}

export function useShell() {
  const [state, setState] = useState<ShellState>(() => ({
    activeAppId: 'loodi',
    tabs: [],
    activeTab: undefined,
    apps: APPS,
    launcherOpen: false,
    settingsOpen: false,
    history: [],
  }))

  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => resolveTheme('system'))

  useEffect(() => {
    fetchAppsFromConfig().then((apps) => {
      setState((s) => ({ ...s, apps }))
    })
  }, [])

  useEffect(() => {
    if (themeMode !== 'system') { setTheme(themeMode); return }
    setTheme(resolveTheme('system'))
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setTheme(resolveTheme('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeMode])

  // Apply theme to shell + broadcast to modules
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.querySelectorAll<HTMLIFrameElement>('iframe[data-app]').forEach((iframe) => {
      iframe.contentWindow?.postMessage({ type: 'loodi:themechange', theme }, '*')
    })
  }, [theme])

  const getApp = useCallback((id: string) => state.apps.find((a) => a.id === id) ?? null, [state.apps])

  const activateApp = useCallback((id: string) => {
    const app = getApp(id)
    if (!app || !app.url) return
    setState((s) => ({
      ...s,
      activeAppId: id,
      tabs: app.id === 'loodi' ? [] : s.tabs,
      activeTab: undefined,
      launcherOpen: false,
      settingsOpen: false,
      history: id === 'loodi' ? [] : [...s.history, id],
    }))
  }, [getApp])

  const toggleLauncher = useCallback(() => {
    setState((s) => ({ ...s, launcherOpen: !s.launcherOpen }))
  }, [])

  const toggleSettings = useCallback(() => {
    setState((s) => ({ ...s, settingsOpen: !s.settingsOpen }))
  }, [])

  const goBack = useCallback(() => {
    setState((s) => {
      if (s.activeAppId === 'loodi') return s
      return { ...s, activeAppId: 'loodi', tabs: [], activeTab: undefined, history: [] }
    })
  }, [])

  const setTabs = useCallback((tabs: Tab[]) => {
    setState((s) => ({
      ...s,
      tabs,
      activeTab: s.activeTab ?? (tabs.length > 0 ? tabs[0].id : undefined),
    }))
  }, [])

  return {
    state,
    theme,
    themeMode,
    setThemeMode,
    activateApp,
    toggleLauncher,
    toggleSettings,
    goBack,
    setTabs,
  }
}

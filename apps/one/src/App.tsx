import { MiniHeader } from '@loodi/ui/mini-header'
import { BottomNav } from '@loodi/ui/bottom-nav'
import { Launcher, type LauncherApp } from '@loodi/ui/launcher'
import { shouldRetryModule, useShell } from './useShell'
import { Settings } from './Settings'
import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'

const HEADER_HEIGHT = 52
const BOTTOM_NAV_CLEARANCE = 72

function readSafeAreaInsets() {
  const styles = window.getComputedStyle(document.documentElement)
  const read = (name: string) => Math.max(0, Number.parseFloat(styles.getPropertyValue(name)) || 0)

  return {
    top: read('--safe-area-inset-top'),
    bottom: read('--safe-area-inset-bottom'),
  }
}

function moduleUrl(url: string, headerHeight: number, bottomNavHeight: number, viewportSafeArea = false) {
  const separator = url.includes('?') ? '&' : '?'
  const viewportParam = viewportSafeArea ? '&viewportSafeArea=1' : ''
  return `${url}${separator}loodi-shell=1&headerHeight=${headerHeight}&bottomNavHeight=${bottomNavHeight}${viewportParam}`
}

function App() {
  const { state, themeMode, setThemeMode, toggleLauncher, activateApp, toggleSettings, registerIframe, goBack, overlayActive, scrollProgress, lastUsedAppId, favoriteAppId, setFavoriteAppId, isLocalBuild, localModuleUrls, setLocalModuleUrls, readyAppIds, setActiveTab, sendHeaderAction, sendBack } = useShell()

  const [exitingId, setExitingId] = useState<string | null>(null)
  const [backward, setBackward] = useState(false)
  const animRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const navStackRef = useRef<string[]>([])
  const retriedAppIds = useRef(new Set<string>())
  const [iframeVersions, setIframeVersions] = useState<Record<string, number>>({})
  const [safeAreaInsets, setSafeAreaInsets] = useState(readSafeAreaInsets)
  const iframeRefCallbacks = useRef(new Map<string, (el: HTMLIFrameElement | null) => void>())

  const getIframeRef = useCallback((appId: string) => {
    let ref = iframeRefCallbacks.current.get(appId)
    if (!ref) {
      ref = (el) => registerIframe(appId, el)
      iframeRefCallbacks.current.set(appId, ref)
    }
    return ref
  }, [registerIframe])

  useLayoutEffect(() => {
    const updateSafeAreaInsets = () => {
      const next = readSafeAreaInsets()
      setSafeAreaInsets((current) => current.top === next.top && current.bottom === next.bottom ? current : next)
    }

    window.addEventListener('resize', updateSafeAreaInsets)
    window.visualViewport?.addEventListener('resize', updateSafeAreaInsets)
    return () => {
      window.removeEventListener('resize', updateSafeAreaInsets)
      window.visualViewport?.removeEventListener('resize', updateSafeAreaInsets)
    }
  }, [])

  const headerHeight = Math.round(HEADER_HEIGHT + safeAreaInsets.top)
  const bottomNavHeight = Math.round(BOTTOM_NAV_CLEARANCE + safeAreaInsets.bottom)

  const reloadModule = useCallback((appId: string) => {
    setIframeVersions((versions) => ({
      ...versions,
      [appId]: (versions[appId] ?? 0) + 1,
    }))
  }, [])

  useEffect(() => {
    const appId = state.activeAppId
    if (!shouldRetryModule(appId, readyAppIds, retriedAppIds.current)) return

    const timeout = window.setTimeout(() => {
      retriedAppIds.current.add(appId)
      reloadModule(appId)
    }, 1500)

    return () => window.clearTimeout(timeout)
  }, [readyAppIds, reloadModule, state.activeAppId])

  const handleActivateApp = useCallback((appId: string) => {
    toggleLauncher()
    if (state.activeAppId !== appId) {
      const stack = navStackRef.current
      const isBackward = stack.length > 0 && appId === stack[stack.length - 1]
      setBackward(isBackward)
      if (isBackward) stack.pop()
      else stack.push(state.activeAppId)
      setExitingId(state.activeAppId)
      clearTimeout(animRef.current)
      animRef.current = setTimeout(() => {
        activateApp(appId)
        setTimeout(() => setExitingId(null), 300)
      }, 200)
    } else {
      activateApp(appId)
    }
  }, [state.activeAppId, toggleLauncher, activateApp])

  const exitClass = backward ? 'animate-exit-back' : 'animate-exit-fwd'
  const enterClass = backward ? 'animate-enter-back' : 'animate-enter-fwd'

  const launcherApps: LauncherApp[] = state.apps
    .filter((a) => a.url)
    .map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      color: a.color,
      active: state.activeAppId === a.id,
      badgeCount: 0,
    }))
  const hideHeaderActions = state.settingsOpen || state.headerOptions.hideActions === true
  const showBack = state.settingsOpen || state.headerOptions.canGoBack === true
  const headerMenuItems = hideHeaderActions
    ? []
    : [
        ...state.headerActions.filter((action) => action.id !== 'settings'),
        { id: 'settings', label: 'Paramètres' },
      ]

  const handleBack = () => {
    if (state.settingsOpen) {
      goBack()
      return
    }
    if (state.headerOptions.canGoBack) sendBack()
  }

  return (
    <div className="h-dvh bg-[var(--color-bg-light)] dark:bg-[var(--color-bg-dark)] text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] overflow-hidden" style={{ fontFamily: 'var(--font-brand)' }}>
      <MiniHeader
        onSettings={toggleSettings}
        onUser={() => {}}
        appName={state.apps.find((a) => a.id === state.activeAppId)?.name}
        scrollProgress={scrollProgress}
        showBack={showBack}
        onBack={handleBack}
        hideActions={hideHeaderActions}
        menuItems={headerMenuItems}
        onMenuItemSelect={sendHeaderAction}
      />

      <div
        id="module-container"
        className="relative w-full h-full overflow-hidden"
      >
        {state.apps.filter((a) => a.url).map((app) => {
          const isExiting = exitingId === app.id
          const isEntering = state.activeAppId === app.id && exitingId !== null && exitingId !== app.id
          const isActive = state.activeAppId === app.id && !isEntering
          const isInactive = !isExiting && !isActive && !isEntering
          const usesViewportSafeArea = app.id === 'loodi-dev'

          return (
            <iframe
              key={`${app.id}-${iframeVersions[app.id] ?? 0}`}
              data-app={app.id}
              ref={getIframeRef(app.id)}
              src={moduleUrl(app.url!, headerHeight, bottomNavHeight, usesViewportSafeArea)}
              style={usesViewportSafeArea ? {
                top: `${headerHeight}px`,
                bottom: `${bottomNavHeight}px`,
                height: `calc(100% - ${headerHeight + bottomNavHeight}px)`,
              } : undefined}
              className={`absolute ${usesViewportSafeArea ? 'inset-x-0 w-full' : 'inset-0 w-full h-full'} border-0
                motion-reduce:transition-none
                ${isExiting ? `${exitClass} z-0 pointer-events-none` : ''}
                ${isEntering ? `${enterClass} z-10` : ''}
                ${isActive ? 'z-10 opacity-100' : ''}
                ${isInactive ? 'z-0 pointer-events-none opacity-0' : ''}
                ${!isExiting && !isEntering ? 'transition-[opacity,transform] duration-200 ease-out' : ''}
              `}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={app.name}
            />
          )
        })}
      </div>

      <BottomNav
        tabs={state.tabs}
        activeTab={state.activeTab}
        hidden={overlayActive}
        onTabTap={(tabId) => {
          if (state.settingsOpen) toggleSettings()
          setActiveTab(tabId)
          const iframe = document.querySelector<HTMLIFrameElement>(`iframe[data-app="${state.activeAppId}"]`)
          iframe?.contentWindow?.postMessage({ type: 'loodi:event', event: 'loodi:tabtap', detail: { tabId } }, '*')
        }}
        onAppsTap={toggleLauncher}
        onAppsLongPress={() => {
          const id = lastUsedAppId.current
          if (id !== state.activeAppId) activateApp(id)
        }}
      />

      <Launcher
        apps={launcherApps}
        open={state.launcherOpen}
        onSelect={handleActivateApp}
        onClose={toggleLauncher}
      />

      {state.settingsOpen && (
        <Settings
          themeMode={themeMode}
          onThemeChange={setThemeMode}
          onClose={toggleSettings}
          apps={state.apps.filter((a) => a.url)}
          favoriteAppId={favoriteAppId}
          onFavoriteChange={setFavoriteAppId}
          developmentApps={isLocalBuild ? state.apps : undefined}
          localModuleUrls={localModuleUrls}
          onLocalModuleUrlsChange={setLocalModuleUrls}
        />
      )}
    </div>
  )
}

export default App

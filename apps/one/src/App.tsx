import { MiniHeader } from '@loodi/ui/mini-header'
import { AccountBottomSheet, AuthBottomSheet, defaultProfileColor } from '@loodi/ui'
import { BottomNav } from '@loodi/ui/bottom-nav'
import { Launcher, type LauncherApp } from '@loodi/ui/launcher'
import { useShell } from './useShell'
import { useAuth } from '@loodi/auth'
import { Settings } from './Settings'
import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'

const HEADER_HEIGHT = 52
const BOTTOM_NAV_CLEARANCE = 72

export function shouldWaitForNonZeroAndroidInset(mode: string) {
  return mode === 'android-device' || mode === 'recette' || mode === 'production'
}

const WAIT_FOR_NON_ZERO_ANDROID_INSET = shouldWaitForNonZeroAndroidInset(import.meta.env.MODE)
const GOOGLE_LINK_RESUME_KEY = 'loodi:resume-after-google-link'

type Toast = { tone: 'success' | 'danger'; text: string }

function readSafeAreaInsets() {
  const styles = window.getComputedStyle(document.documentElement)
  const read = (name: string) => Math.max(0, Number.parseFloat(styles.getPropertyValue(name)) || 0)

  return {
    top: read('--safe-area-inset-top'),
    bottom: read('--safe-area-inset-bottom'),
  }
}

function hasNativeSafeAreaInjection() {
  return document.documentElement.style.getPropertyValue('--safe-area-inset-top') !== ''
    || document.documentElement.style.getPropertyValue('--safe-area-inset-bottom') !== ''
}

export function nativeSafeAreaReady(
  protocol: string,
  hostname: string,
  injected: boolean,
  topInset = 0,
  waitForNonZeroInset = false,
) {
  const nativeShell = protocol === 'capacitor:' || (protocol === 'https:' && hostname === 'app')
  return !nativeShell || (injected && (!waitForNonZeroInset || topInset > 0))
}

function moduleUrl(url: string, headerHeight: number, bottomNavHeight: number) {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}loodi-shell=1&headerHeight=${headerHeight}&bottomNavHeight=${bottomNavHeight}`
}

export function readMagicLinkCallback(hash: string): 'success' | 'expired' | null {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  if (params.get('error_code') === 'otp_expired') return 'expired'
  if (params.has('access_token') && params.get('type') === 'magiclink') return 'success'
  return null
}

function AppToast({ toast }: { toast: Toast }) {
  const tones = {
    success: 'bg-[var(--color-theme-status-success-solid)]',
    danger: 'bg-[var(--color-theme-status-danger-solid)]',
  }
  return <p className={`fixed z-[60] left-4 right-4 mx-auto w-max rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${tones[toast.tone]}`} style={{ bottom: 'calc(1rem + var(--safe-area-inset-bottom) + 3.5rem + .75rem)', maxWidth: 'calc(100% - 2rem)' }} role="status">{toast.tone === 'success' ? '✓ ' : '✗ '}{toast.text}</p>
}

function App() {
  const auth = useAuth()
  const { state, toggleLauncher, activateApp, toggleSettings, showLoodiAccount, registerIframe, goBack, overlayActive, scrollProgress, lastUsedAppId, favoriteAppId, setFavoriteAppId, isLocalBuild, localModuleUrls, setLocalModuleUrls, setActiveTab, sendHeaderAction, sendBack, sendTabTap } = useShell(auth.session)
  const [authOpen, setAuthOpen] = useState(false)
  const [accountOverlayOpen, setAccountOverlayOpen] = useState(false)
  const [accountScrollProgress, setAccountScrollProgress] = useState(0)
  const [accountSuccessMessage, setAccountSuccessMessage] = useState<string | undefined>()
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [magicLinkCallback, setMagicLinkCallback] = useState(() => readMagicLinkCallback(window.location.hash))
  const [appToast, setAppToast] = useState<Toast | null>(null)

  const [exitingId, setExitingId] = useState<string | null>(null)
  const [backward, setBackward] = useState(false)
  const animRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const navStackRef = useRef<string[]>([])
  const [safeAreaInsets, setSafeAreaInsets] = useState(readSafeAreaInsets)

  useEffect(() => {
    if (auth.state === 'handle-required') setAuthOpen(true)
    if (auth.state === 'authenticated') {
      setAuthOpen(false)
    }
  }, [auth.state])
  useEffect(() => {
    if (!magicLinkCallback) return
    if (magicLinkCallback === 'expired') {
      setAppToast({ tone: 'danger', text: 'Ce lien de connexion a expiré. Demande-en un nouveau.' })
    } else if (auth.state === 'authenticated') {
      setAppToast({ tone: 'success', text: 'Connexion réussie. Heureux de te revoir !' })
    } else if (auth.state === 'handle-required') {
      setAppToast({ tone: 'success', text: 'Connexion réussie. Choisis maintenant ton nom de joueur.' })
    } else return

    setMagicLinkCallback(null)
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`)
  }, [auth.state, magicLinkCallback])
  useEffect(() => {
    if (!appToast) return
    const timer = window.setTimeout(() => setAppToast(null), appToast.tone === 'danger' ? 3000 : 1500)
    return () => window.clearTimeout(timer)
  }, [appToast])
  useEffect(() => {
    const handleNativeAuthResult = (event: Event) => {
      const detail = (event as CustomEvent<{ success: boolean; error?: unknown }>).detail
      if (detail.success) setAppToast({ tone: 'success', text: 'Connexion réussie. Heureux de te revoir !' })
      else setAppToast({ tone: 'danger', text: detail.error instanceof Error ? detail.error.message : 'La connexion n’a pas pu être terminée.' })
    }
    window.addEventListener('loodi:native-auth-result', handleNativeAuthResult)
    return () => window.removeEventListener('loodi:native-auth-result', handleNativeAuthResult)
  }, [])
  useEffect(() => {
    if (!auth.session || sessionStorage.getItem(GOOGLE_LINK_RESUME_KEY) !== 'account') return
    sessionStorage.removeItem(GOOGLE_LINK_RESUME_KEY)
    setAccountSuccessMessage('Ton compte Google est maintenant associé.')
    showLoodiAccount()
  }, [auth.session, showLoodiAccount])
  useEffect(() => { setAccountScrollProgress(0) }, [state.settingsOpen, state.settingsPage])

  const linkGoogleIdentity = useCallback(async () => {
    sessionStorage.setItem(GOOGLE_LINK_RESUME_KEY, 'account')
    try {
      await auth.linkGoogleIdentity()
    } catch (error) {
      sessionStorage.removeItem(GOOGLE_LINK_RESUME_KEY)
      throw error
    }
  }, [auth])
  const [moduleFramesReady, setModuleFramesReady] = useState(() => {
    return nativeSafeAreaReady(
      window.location.protocol,
      window.location.hostname,
      hasNativeSafeAreaInjection(),
      readSafeAreaInsets().top,
      WAIT_FOR_NON_ZERO_ANDROID_INSET,
    )
  })
  const iframeRefCallbacks = useRef(new Map<string, (el: HTMLIFrameElement | null) => void>())
  const iframeSources = useRef(new Map<string, { url: string; src: string }>())

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
      if (nativeSafeAreaReady(
        window.location.protocol,
        window.location.hostname,
        hasNativeSafeAreaInjection(),
        next.top,
        WAIT_FOR_NON_ZERO_ANDROID_INSET,
      )) setModuleFramesReady(true)
    }

    const observer = new MutationObserver(updateSafeAreaInsets)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    updateSafeAreaInsets()

    return () => {
      observer.disconnect()
    }
  }, [])

  const headerHeight = Math.round(HEADER_HEIGHT + safeAreaInsets.top)
  const bottomNavHeight = Math.round(BOTTOM_NAV_CLEARANCE + safeAreaInsets.bottom)

  // A module owns its in-iframe route and runtime. Safe-area changes can
  // happen when Android/iOS presents a camera permission sheet, so they must
  // only update the shell layout—not rewrite iframe.src and reload the PWA.
  const getIframeSource = useCallback((appId: string, url: string) => {
    const current = iframeSources.current.get(appId)
    if (current?.url === url) return current.src

    const src = moduleUrl(url, headerHeight, bottomNavHeight)
    iframeSources.current.set(appId, { url, src })
    return src
  }, [headerHeight, bottomNavHeight])

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
  const playerHandle = auth.profile?.handle ?? auth.session?.handle
  const playerInitial = playerHandle?.trim().charAt(0).toLocaleUpperCase('fr-FR')

  return (
    <div className="h-dvh bg-[var(--color-bg-light)] dark:bg-[var(--color-bg-dark)] text-[var(--color-text-light)] dark:text-[var(--color-text-primary-dark)] overflow-hidden" style={{ fontFamily: 'var(--font-brand)' }}>
      <MiniHeader
        onSettings={toggleSettings}
        onUser={() => {
          if (auth.state === 'authenticated') {
            setProfileSheetOpen(true)
          } else setAuthOpen(true)
        }}
        userInitial={auth.state === 'authenticated' ? playerInitial : undefined}
        userAvatarColor={auth.state === 'authenticated' ? auth.profile?.profileColor ?? defaultProfileColor(playerHandle) : undefined}
        appName={state.apps.find((a) => a.id === state.activeAppId)?.name}
        scrollProgress={state.settingsOpen ? accountScrollProgress : scrollProgress}
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
        {moduleFramesReady && state.apps.filter((a) => a.url).map((app) => {
          const isExiting = exitingId === app.id
          const isEntering = state.activeAppId === app.id && exitingId !== null && exitingId !== app.id
          const isActive = state.activeAppId === app.id && !isEntering
          const isInactive = !isExiting && !isActive && !isEntering
          return (
            <iframe
              key={app.id}
              data-app={app.id}
              ref={getIframeRef(app.id)}
              src={getIframeSource(app.id, app.url!)}
              className={`absolute inset-0 w-full h-full border-0
                motion-reduce:transition-none
                ${isExiting ? `${exitClass} z-0 pointer-events-none` : ''}
                ${isEntering ? `${enterClass} z-10` : ''}
                ${isActive ? 'z-10 opacity-100' : ''}
                ${isInactive ? 'z-0 pointer-events-none opacity-0' : ''}
                ${!isExiting && !isEntering ? 'transition-[opacity,transform] duration-200 ease-out' : ''}
              `}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              allow="camera"
              title={app.name}
            />
          )
        })}
      </div>

      <BottomNav
        tabs={state.tabs}
        activeTab={state.activeTab}
        hidden={overlayActive || accountOverlayOpen || profileSheetOpen || state.tabs.length === 0}
        onTabTap={(tabId) => {
          if (state.settingsOpen) toggleSettings()
          setActiveTab(tabId)
          sendTabTap(tabId)
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
          onClose={toggleSettings}
          apps={state.apps.filter((a) => a.url)}
          favoriteAppId={favoriteAppId}
          onFavoriteChange={setFavoriteAppId}
          developmentApps={isLocalBuild ? state.apps : undefined}
          localModuleUrls={localModuleUrls}
          onLocalModuleUrlsChange={setLocalModuleUrls}
          accountName={auth.profile?.handle}
          accountProfileColor={auth.profile?.profileColor}
          initialPage={state.settingsPage}
          onSignIn={() => setAuthOpen(true)}
          isAuthenticated={auth.session !== null}
          onOverlayChange={setAccountOverlayOpen}
          onLinkGoogleIdentity={linkGoogleIdentity}
          onUnlinkGoogleIdentity={auth.unlinkGoogleIdentity}
          accountSuccessMessage={accountSuccessMessage}
          onAccountScrollProgress={setAccountScrollProgress}
        />
      )}

      <AccountBottomSheet
        open={profileSheetOpen}
        playerName={playerHandle}
        onClose={() => setProfileSheetOpen(false)}
        onOpenAccount={showLoodiAccount}
        onSignOut={auth.signOut}
      />

      {appToast && <AppToast toast={appToast} />}

      <AuthBottomSheet
        open={authOpen}
        state={auth.state === 'handle-required' ? 'handle-required' : 'anonymous'}
        onClose={() => setAuthOpen(false)}
        onSignInWithGoogle={auth.signInWithGoogle}
        onSignInWithMagicLink={auth.signInWithMagicLink}
        onCompleteHandle={auth.completeHandle}
        onAbandonIncompleteAccount={auth.abandonIncompleteAccount}
      />
    </div>
  )
}

export default App

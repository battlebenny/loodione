import { MiniHeader } from '@loodi/ui/mini-header'
import { defaultProfileColor } from '@loodi/ui'
import { BottomNav } from '@loodi/ui/bottom-nav'
import { Launcher, type LauncherApp } from '@loodi/ui/launcher'
import { useShell } from './useShell'
import { useAuth } from '@loodi/auth'
import { X } from 'lucide-react'
import { Settings } from './Settings'
import { BottomSheet } from './BottomSheet'
import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'

const HEADER_HEIGHT = 52
const BOTTOM_NAV_CLEARANCE = 72

export function shouldWaitForNonZeroAndroidInset(mode: string) {
  return mode === 'android-device' || mode === 'recette' || mode === 'production'
}

const WAIT_FOR_NON_ZERO_ANDROID_INSET = shouldWaitForNonZeroAndroidInset(import.meta.env.MODE)
const GOOGLE_LINK_RESUME_KEY = 'loodi:resume-after-google-link'

type NoticeTone = 'info' | 'warning' | 'danger'
type Toast = { tone: 'success' | 'danger'; text: string }
type AuthPendingAction = 'magic-link' | 'google' | 'handle' | 'signout' | 'abandon'

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3.2-4.3 3.2-7.3Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z" />
      <path fill="#EA4335" d="M12 6.1c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 3 14.7 2 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1Z" />
    </svg>
  )
}

function AuthNotice({ tone, children }: { tone: NoticeTone; children: string }) {
  const styles: Record<NoticeTone, string> = {
    info: 'border-[var(--color-theme-status-info-border)] bg-[var(--color-theme-status-info-surface)] text-[var(--color-theme-status-info-text)]',
    warning: 'border-[var(--color-theme-status-warning-border)] bg-[var(--color-theme-status-warning-surface)] text-[var(--color-theme-status-warning-text)]',
    danger: 'border-[var(--color-theme-status-danger-border)] bg-[var(--color-theme-status-danger-surface)] text-[var(--color-theme-status-danger-text)]',
  }
  return <p className={`mt-3 rounded-lg border px-3 py-2 text-sm ${styles[tone]}`} role="status">{children}</p>
}

function authFailureNotice(error: Error): { tone: NoticeTone; text: string } {
  const text = error.message
  return {
    tone: text.includes('nom de joueur est déjà pris') ? 'warning' : 'danger',
    text,
  }
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
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [authMessage, setAuthMessage] = useState<{ tone: NoticeTone; text: string } | null>(null)
  const [authPendingAction, setAuthPendingAction] = useState<AuthPendingAction | null>(null)
  const [accountOverlayOpen, setAccountOverlayOpen] = useState(false)
  const [accountSuccessMessage, setAccountSuccessMessage] = useState<string | undefined>()
  const [profileSheet, setProfileSheet] = useState<'menu' | 'signout' | null>(null)
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
      setConfirmSignOut(false)
      setAuthPendingAction(null)
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

  const linkGoogleIdentity = useCallback(async () => {
    sessionStorage.setItem(GOOGLE_LINK_RESUME_KEY, 'account')
    try {
      await auth.linkGoogleIdentity()
    } catch (error) {
      sessionStorage.removeItem(GOOGLE_LINK_RESUME_KEY)
      throw error
    }
  }, [auth])
  const runAuthAction = useCallback(async (action: AuthPendingAction, callback: () => Promise<void>) => {
    if (authPendingAction) return
    setAuthPendingAction(action)
    try {
      await callback()
    } finally {
      setAuthPendingAction(null)
    }
  }, [authPendingAction])
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
            setProfileSheet('menu')
          } else setAuthOpen(true)
        }}
        userInitial={auth.state === 'authenticated' ? playerInitial : undefined}
        userAvatarColor={auth.state === 'authenticated' ? auth.profile?.profileColor ?? defaultProfileColor(playerHandle) : undefined}
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
        hidden={overlayActive || accountOverlayOpen || profileSheet !== null || state.tabs.length === 0}
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
        />
      )}

      <BottomSheet open={profileSheet === 'menu'} onClose={() => setProfileSheet(null)} title="Mon compte Loodi">
        {playerHandle && <p className="mb-5 text-sm text-black/60 dark:text-white/65">@{playerHandle}</p>}
        <button
          type="button"
          className="w-full rounded-lg bg-[#ca4a16] p-3 text-white transition-colors hover:bg-[#b33d0f]"
          onClick={() => { setProfileSheet(null); showLoodiAccount() }}
        >
          Gérer mon compte
        </button>
        <button
          type="button"
          className="mt-3 w-full rounded-lg border border-black/15 bg-white/80 p-3 text-[var(--color-text-light)] transition-colors hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-[var(--color-text-primary-dark)] dark:hover:bg-white/20"
          onClick={() => setProfileSheet('signout')}
        >
          Se déconnecter
        </button>
      </BottomSheet>

      <BottomSheet open={profileSheet === 'signout'} onClose={() => setProfileSheet(null)} title="Se déconnecter">
        <p className="text-sm text-black/70 dark:text-white/75">Tu veux vraiment changer de compte ? Tu pourras te reconnecter quand tu veux.</p>
        <button type="button" className="mt-5 w-full rounded-lg bg-[#ca4a16] p-3 text-white transition-colors hover:bg-[#b33d0f]" onClick={() => setProfileSheet(null)}>Rester connecté</button>
        <button type="button" disabled={authPendingAction !== null} className="mt-3 w-full rounded-lg border border-black/15 bg-white/80 p-3 text-[var(--color-text-light)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-[var(--color-text-primary-dark)] dark:hover:bg-white/20" onClick={() => void runAuthAction('signout', () => auth.signOut()).then(() => setProfileSheet(null)).catch((error: Error) => setAuthMessage({ tone: 'danger', text: error.message }))}>{authPendingAction === 'signout' ? 'Déconnexion…' : 'Se déconnecter'}</button>
      </BottomSheet>

      {appToast && <AppToast toast={appToast} />}

      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Connexion Loodi">
          <form className="w-full max-w-md rounded-2xl border border-black/5 bg-white/90 p-5 text-[var(--color-text-light)] shadow-xl dark:border-white/10 dark:bg-[var(--color-bg-dark)] dark:text-[var(--color-text-primary-dark)]" onSubmit={(event) => {
            event.preventDefault()
            if (auth.state === 'handle-required') {
              void runAuthAction('handle', () => auth.completeHandle(handle))
                .then(() => { setAuthOpen(false); setAuthMessage(null) })
                .catch((error: Error) => setAuthMessage(authFailureNotice(error)))
            } else {
              void runAuthAction('magic-link', () => auth.signInWithMagicLink(email))
                .then(() => setAuthMessage({ tone: 'info', text: 'Le lien est en route : regarde ta boîte e-mail.' }))
                .catch((error: Error) => setAuthMessage({ tone: 'danger', text: error.message }))
            }
          }}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-xl">{confirmSignOut ? auth.state === 'handle-required' ? 'Annuler l’inscription' : 'Changer de compte' : auth.state === 'handle-required' ? 'Quel nom choisiras-tu ?' : 'Bienvenue dans Loodi'}</h2>
              <button type="button" disabled={authPendingAction !== null} className="-mr-1 -mt-1 rounded-full p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-black/5 hover:text-[var(--color-text-light)] disabled:cursor-not-allowed disabled:opacity-60 dark:text-[var(--color-text-secondary-dark)] dark:hover:bg-white/10 dark:hover:text-[var(--color-text-primary-dark)]" onClick={() => { if (confirmSignOut) { setConfirmSignOut(false); return } if (auth.state === 'handle-required') { setConfirmSignOut(true); return } setAuthOpen(false) }} aria-label="Fermer">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {confirmSignOut ? <>
              <p className="mt-2 text-sm">{auth.state === 'handle-required' ? 'Ton inscription n’est pas terminée. Si tu l’annules, ce compte provisoire sera supprimé.' : 'Tu pourras te reconnecter avec ce compte quand tu veux.'}</p>
              <button type="button" disabled={authPendingAction !== null} className="mt-5 w-full rounded-lg bg-[#ca4a16] p-3 text-white disabled:cursor-not-allowed disabled:opacity-60" onClick={() => setConfirmSignOut(false)}>{auth.state === 'handle-required' ? 'Continuer mon inscription' : 'Rester connecté'}</button>
              <button type="button" disabled={authPendingAction !== null} className="mt-3 w-full rounded-lg border border-black/15 bg-white/80 p-3 text-[var(--color-text-light)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-[var(--color-text-primary-dark)] dark:hover:bg-white/20" onClick={() => void runAuthAction(auth.state === 'handle-required' ? 'abandon' : 'signout', () => auth.state === 'handle-required' ? auth.abandonIncompleteAccount() : auth.signOut()).then(() => { setConfirmSignOut(false); setAuthOpen(false) }).catch((error: Error) => setAuthMessage(authFailureNotice(error)))}>{authPendingAction === 'abandon' ? 'Annulation…' : authPendingAction === 'signout' ? 'Déconnexion…' : auth.state === 'handle-required' ? 'Annuler l’inscription' : 'Se déconnecter'}</button>
            </> : auth.state === 'handle-required' ? <>
              <p className="mt-2 text-sm">C’est le nom sous lequel la communauté te reconnaîtra.</p>
              <label className="mt-4 block text-sm" htmlFor="auth-handle">Nom de joueur</label>
              <input id="auth-handle" disabled={authPendingAction !== null} value={handle} onChange={(event) => setHandle(event.target.value)} className="mt-1 w-full rounded-lg border border-black/15 bg-white p-3 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5" autoComplete="username" />
              <button type="submit" disabled={authPendingAction !== null} className="mt-3 w-full rounded-lg bg-[#ca4a16] p-3 text-white disabled:cursor-not-allowed disabled:opacity-60">{authPendingAction === 'handle' ? 'Enregistrement…' : 'C’est parti'}</button>
              <button type="button" disabled={authPendingAction !== null} className="mt-3 w-full text-sm underline disabled:cursor-not-allowed disabled:opacity-60" onClick={() => setConfirmSignOut(true)}>Utiliser un autre compte</button>
            </> : <>
              <button type="button" disabled={authPendingAction !== null} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-black/15 bg-white/80 p-3 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20" onClick={() => void runAuthAction('google', () => auth.signInWithGoogle()).catch((error: Error) => setAuthMessage({ tone: 'danger', text: error.message }))}><GoogleIcon />{authPendingAction === 'google' ? 'Connexion…' : 'Continuer avec Google'}</button>
              <label className="mt-4 block text-sm" htmlFor="auth-email">E-mail</label>
              <input id="auth-email" type="email" required disabled={authPendingAction !== null} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-black/15 bg-white p-3 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5" autoComplete="email" />
              <button type="submit" disabled={authPendingAction !== null} className="mt-3 w-full rounded-lg bg-[#ca4a16] p-3 text-white disabled:cursor-not-allowed disabled:opacity-60">{authPendingAction === 'magic-link' ? 'Envoi…' : 'Recevoir un lien magique'}</button>
            </>}
            {authMessage && <AuthNotice tone={authMessage.tone}>{authMessage.text}</AuthNotice>}
            {auth.state !== 'handle-required' && <button type="button" disabled={authPendingAction !== null} className="mt-4 w-full text-sm underline disabled:cursor-not-allowed disabled:opacity-60" onClick={() => setAuthOpen(false)}>Fermer</button>}
          </form>
        </div>
      )}
    </div>
  )
}

export default App

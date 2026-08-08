import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { nativeSafeAreaReady, shouldWaitForNonZeroAndroidInset } from '../App'

const sendHeaderAction = vi.hoisted(() => vi.fn())
const sendBack = vi.hoisted(() => vi.fn())
const sendTabTap = vi.hoisted(() => vi.fn())
const setActiveTab = vi.hoisted(() => vi.fn())
const goBack = vi.hoisted(() => vi.fn())
const registerIframe = vi.hoisted(() => vi.fn())
const toggleLauncher = vi.hoisted(() => vi.fn())
const shellSettings = vi.hoisted(() => ({ open: false, page: undefined as 'account' | undefined }))
const shellHeaderOptions = vi.hoisted(() => ({ hideActions: false, canGoBack: false }))
const shellActiveApp = vi.hoisted(() => ({ id: 'loodi-dev' }))
const shellApps = vi.hoisted(() => ({
  value: [{ id: 'loodi-dev', name: 'Dev', icon: '⚙️', color: '#6B7280', url: 'https://dummy.loodi.test:4000' }],
}))
const shellTabs = vi.hoisted(() => ({ value: [] as { id: string; icon: string; label: string }[] }))
const shellOverlay = vi.hoisted(() => ({ value: false }))
const showLoodiAccount = vi.hoisted(() => vi.fn())
const signOut = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const signInWithGoogle = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const signInWithMagicLink = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const completeHandle = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const auth = vi.hoisted(() => ({
  state: 'anonymous' as 'anonymous' | 'authenticated' | 'handle-required',
  session: null as { userId: string; accessToken: string; expiresAt: number; handle?: string } | null,
  profile: null as { id: string; handle: string } | null,
}))

vi.mock('@loodi/auth', () => ({
  useAuth: () => ({
    ...auth,
    email: null,
    hasGoogleIdentity: false,
    error: null,
    signOut,
    signInWithGoogle,
    signInWithMagicLink,
    abandonIncompleteAccount: vi.fn(),
    deleteAccount: vi.fn(),
    updateEmail: vi.fn(),
    linkGoogleIdentity: vi.fn(),
    unlinkGoogleIdentity: vi.fn(),
    completeHandle,
  }),
}))

vi.mock('../useShell', () => ({
  shouldRetryModule: () => false,
  useShell: () => ({
    state: {
      activeAppId: shellActiveApp.id,
      apps: shellApps.value,
      tabs: shellTabs.value,
      activeTab: null,
      headerActions: [{ id: 'new-game', label: 'Nouveau jeu' }],
      headerOptions: shellHeaderOptions,
      settingsOpen: shellSettings.open,
      settingsPage: shellSettings.page,
      launcherOpen: false,
    },
    themeMode: 'auto',
    setThemeMode: vi.fn(),
    toggleLauncher,
    activateApp: vi.fn(),
    toggleSettings: vi.fn(),
    showLoodiAccount,
    registerIframe,
    goBack,
    overlayActive: shellOverlay.value,
    scrollProgress: 0,
    lastUsedAppId: { current: 'loodi-dev' },
    favoriteAppId: null,
    setFavoriteAppId: vi.fn(),
    isLocalBuild: true,
    localModuleUrls: {},
    setLocalModuleUrls: vi.fn(),
    readyAppIds: new Set<string>(),
    setActiveTab,
    sendHeaderAction,
    sendBack,
    sendTabTap,
  }),
}))

describe('module frame', () => {
  beforeEach(() => {
    shellSettings.open = false
    shellSettings.page = undefined
    shellHeaderOptions.hideActions = false
    shellHeaderOptions.canGoBack = false
    shellActiveApp.id = 'loodi-dev'
    shellApps.value = [{ id: 'loodi-dev', name: 'Dev', icon: '⚙️', color: '#6B7280', url: 'https://dummy.loodi.test:4000' }]
    shellTabs.value = []
    shellOverlay.value = false
    sendHeaderAction.mockClear()
    sendBack.mockClear()
    sendTabTap.mockClear()
    setActiveTab.mockClear()
    goBack.mockClear()
    registerIframe.mockClear()
    toggleLauncher.mockClear()
    showLoodiAccount.mockClear()
    signOut.mockClear()
    signInWithGoogle.mockReset()
    signInWithGoogle.mockResolvedValue(undefined)
    signInWithMagicLink.mockReset()
    signInWithMagicLink.mockResolvedValue(undefined)
    completeHandle.mockReset()
    completeHandle.mockResolvedValue(undefined)
    auth.state = 'anonymous'
    auth.session = null
    auth.profile = null
    document.documentElement.style.setProperty('--safe-area-inset-top', '24px')
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '16px')
  })

  afterEach(() => {
    cleanup()
    window.history.replaceState({}, '', '/')
    document.documentElement.style.removeProperty('--safe-area-inset-top')
    document.documentElement.style.removeProperty('--safe-area-inset-bottom')
  })

  it('waits for native safe-area injection before rendering native module frames', () => {
    expect(nativeSafeAreaReady('https:', 'app', false)).toBe(false)
    expect(nativeSafeAreaReady('https:', 'app', true)).toBe(true)
    expect(nativeSafeAreaReady('http:', 'localhost', false)).toBe(true)
  })

  it('does not treat Capacitor’s initial zero inset as ready in affected Android builds', () => {
    expect(nativeSafeAreaReady('https:', 'app', true, 0, true)).toBe(false)
    expect(nativeSafeAreaReady('https:', 'app', true, 24, true)).toBe(true)
    expect(nativeSafeAreaReady('https:', 'app', true, 0, false)).toBe(true)
  })

  it('applies the native safe-area readiness guard to the production Android build', () => {
    expect(shouldWaitForNonZeroAndroidInset('production')).toBe(true)
    expect(shouldWaitForNonZeroAndroidInset('android-emulator')).toBe(false)
    expect(shouldWaitForNonZeroAndroidInset('development')).toBe(false)
  })

  it('passes safe-area clearances to modules while keeping their backgrounds behind the shell glass', () => {
    const { container } = render(<App />)
    const frame = container.querySelector<HTMLIFrameElement>('iframe[data-app="loodi-dev"]')!
    const url = new URL(frame.src)

    expect(url.searchParams.get('headerHeight')).toBe('76')
    expect(url.searchParams.get('bottomNavHeight')).toBe('88')
    expect(url.searchParams.get('viewportSafeArea')).toBeNull()
    expect(frame).toHaveClass('inset-0', 'w-full', 'h-full')
    expect(frame.style.top).toBe('')
    expect(frame.style.bottom).toBe('')
    expect(frame.getAttribute('allow')).toBe('camera')
  })

  it('keeps the Collec background full-screen while its content receives shell clearances', () => {
    shellActiveApp.id = 'loodi'
    shellApps.value = [{ id: 'loodi', name: 'collec', icon: '📚', color: '#ca4a16', url: 'https://collec.loodi.test:4002' }]

    const { container } = render(<App />)
    const frame = container.querySelector<HTMLIFrameElement>('iframe[data-app="loodi"]')!

    const url = new URL(frame.src)

    expect(frame).toHaveClass('inset-0', 'w-full', 'h-full')
    expect(url.searchParams.get('headerHeight')).toBe('76')
    expect(url.searchParams.get('bottomNavHeight')).toBe('88')
  })

  it('keeps iframe refs stable across renders to avoid repeated registrations', () => {
    const { rerender } = render(<App />)
    const registrationsAfterMount = registerIframe.mock.calls.length

    expect(registrationsAfterMount).toBeGreaterThan(0)

    rerender(<App />)

    expect(registerIframe).toHaveBeenCalledTimes(registrationsAfterMount)
  })

  it('keeps the shell header in place behind an active module overlay', () => {
    shellOverlay.value = true
    const { container } = render(<App />)
    const header = container.querySelector('header.loodi-mini-header')!
    const frame = container.querySelector<HTMLIFrameElement>('iframe[data-app="loodi-dev"]')!

    expect(header).toHaveClass('loodi-mini-header--behind-overlay')
    expect(frame).toHaveClass('z-0')
    expect(within(container).getByTestId('module-overlay-header-backdrop')).toBeInTheDocument()
  })

  it('lets the dev dummy persist and apply both shell clearances without moving its full-screen background', () => {
    const dummy = readFileSync(resolve(process.cwd(), '../dummy/src/safeArea.ts'), 'utf8')

    expect(dummy).toContain('--shell-safe-top')
    expect(dummy).toContain('--shell-safe-bottom')
    expect(dummy).toContain('headerHeight')
    expect(dummy).toContain('bottomNavHeight')
    expect(dummy).toContain('localStorage')
  })

  it('shows declared module actions and returns the selected action to the module', () => {
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Plus' }))
    expect(within(container).getByRole('button', { name: 'Paramètres' })).toBeInTheDocument()
    fireEvent.click(within(container).getByRole('button', { name: 'Nouveau jeu' }))

    expect(sendHeaderAction).toHaveBeenCalledWith('new-game')
  })

  it('hides the shell navigation when a module declares no tabs', () => {
    shellActiveApp.id = 'loodi'
    const { container } = render(<App />)

    expect(within(container).getByRole('navigation')).toHaveClass('loodi-bottom-nav--hidden')
  })

  it('keeps the static Loodi launcher control alongside four declared module tabs', () => {
    shellTabs.value = [
      { id: 'home', icon: 'home', label: 'Accueil' },
      { id: 'catalog', icon: 'search', label: 'Collection' },
      { id: 'scanner', icon: 'scan', label: 'Scanner' },
      { id: 'loans', icon: 'rss', label: 'Prêts' },
    ]
    const { container } = render(<App />)
    const navigation = within(container).getByRole('navigation')

    const appsButton = within(navigation).getByRole('button', { name: 'Applications' })

    expect(within(navigation).getAllByRole('button')).toHaveLength(5)
    expect(within(navigation).getByText('Loodi')).toBeInTheDocument()
    fireEvent.click(appsButton)
    expect(toggleLauncher).toHaveBeenCalledOnce()
  })

  it('delegates a module tab tap to the strict bridge transport', () => {
    shellTabs.value = [{ id: 'home', icon: 'home', label: 'Accueil' }]
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Accueil' }))

    expect(sendTabTap).toHaveBeenCalledWith('home')
  })

  it('hides profile and more actions while settings are open', () => {
    shellSettings.open = true
    shellSettings.page = 'account'
    const { container } = render(<App />)

    expect(within(container).queryByRole('button', { name: 'Profil' })).not.toBeInTheDocument()
    expect(within(container).queryByRole('button', { name: 'Plus' })).not.toBeInTheDocument()
  })

  it('fades the MiniHeader glass in as the account page scrolls', () => {
    shellSettings.open = true
    shellSettings.page = 'account'
    const { container } = render(<App />)
    const glass = container.querySelector('.loodi-mini-header__glass')
    const accountScrollContainer = screen.getByTestId('loodi-account-scroll-container')

    expect(glass).toHaveStyle({ opacity: '0' })
    Object.defineProperty(accountScrollContainer, 'scrollTop', { configurable: true, value: 26 })
    fireEvent.scroll(accountScrollContainer)
    expect(glass).toHaveStyle({ opacity: '0.5' })
    Object.defineProperty(accountScrollContainer, 'scrollTop', { configurable: true, value: 52 })
    fireEvent.scroll(accountScrollContainer)
    expect(glass).toHaveStyle({ opacity: '1' })
  })

  it('keeps the One settings back action unchanged', () => {
    shellSettings.open = true
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Retour' }))

    expect(goBack).toHaveBeenCalledOnce()
    expect(sendBack).not.toHaveBeenCalled()
  })

  it('hides and restores profile and more actions from the active module options', () => {
    shellHeaderOptions.hideActions = true
    const { container, rerender } = render(<App />)

    expect(within(container).queryByRole('button', { name: 'Profil' })).not.toBeInTheDocument()
    expect(within(container).queryByRole('button', { name: 'Plus' })).not.toBeInTheDocument()

    shellHeaderOptions.hideActions = false
    rerender(<App />)

    expect(within(container).getByRole('button', { name: 'Profil' })).toBeInTheDocument()
    expect(within(container).getByRole('button', { name: 'Plus' })).toBeInTheDocument()
  })

  it('shows a module back button only when canGoBack is enabled and delegates its click', () => {
    shellActiveApp.id = 'loodi'
    shellHeaderOptions.canGoBack = true
    const { container, rerender } = render(<App />)
    const backButton = within(container).getByRole('button', { name: 'Retour' })

    fireEvent.click(backButton)
    expect(sendBack).toHaveBeenCalledOnce()
    expect(goBack).not.toHaveBeenCalled()

    shellHeaderOptions.canGoBack = false
    rerender(<App />)

    expect(within(container).queryByRole('button', { name: 'Retour' })).not.toBeInTheDocument()
  })

  it('opens the connected profile sheet instead of signing out immediately', () => {
    auth.state = 'authenticated'
    auth.session = { userId: 'user-1', accessToken: 'token', expiresAt: 0, handle: 'battle_benny' }
    auth.profile = { id: 'user-1', handle: 'battle_benny' }
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Profil' }))

    expect(screen.getByText('Mon compte Loodi')).toBeInTheDocument()
    expect(signOut).not.toHaveBeenCalled()
  })

  it('opens the global authentication sheet from the disconnected avatar', () => {
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Profil' }))

    expect(screen.getByRole('heading', { name: 'Connexion Loodi' })).toBeInTheDocument()
  })

  it('hides the bottom navigation while the connected profile sheet is open', () => {
    auth.state = 'authenticated'
    auth.session = { userId: 'user-1', accessToken: 'token', expiresAt: 0, handle: 'battle_benny' }
    auth.profile = { id: 'user-1', handle: 'battle_benny' }
    shellTabs.value = [{ id: 'home', icon: 'home', label: 'Accueil' }]
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Profil' }))

    expect(within(container).getByRole('navigation')).toHaveClass('loodi-bottom-nav--hidden')
  })

  it('opens account management from the connected profile sheet', () => {
    auth.state = 'authenticated'
    auth.session = { userId: 'user-1', accessToken: 'token', expiresAt: 0, handle: 'battle_benny' }
    auth.profile = { id: 'user-1', handle: 'battle_benny' }
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Profil' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gérer mon compte' }))

    expect(showLoodiAccount).toHaveBeenCalledOnce()
  })

  it('requires confirmation before signing out from the connected profile sheet', () => {
    auth.state = 'authenticated'
    auth.session = { userId: 'user-1', accessToken: 'token', expiresAt: 0, handle: 'battle_benny' }
    auth.profile = { id: 'user-1', handle: 'battle_benny' }
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Profil' }))
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }))

    expect(screen.getByText('Tu veux vraiment changer de compte ? Tu pourras te reconnecter quand tu veux.')).toBeInTheDocument()
    expect(signOut).not.toHaveBeenCalled()
  })

  it('closes a shell bottom sheet when its handle is dragged down', async () => {
    auth.state = 'authenticated'
    auth.session = { userId: 'user-1', accessToken: 'token', expiresAt: 0, handle: 'battle_benny' }
    auth.profile = { id: 'user-1', handle: 'battle_benny' }
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Profil' }))
    const handle = await screen.findByTestId('bottom-sheet-handle')
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 210 })
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 210 })

    expect(screen.queryByRole('dialog', { name: 'Mon compte Loodi' })).not.toBeInTheDocument()
  })

  it('confirms a successful magic-link connection after returning from the email', () => {
    window.history.replaceState({}, '', '/#access_token=token&type=magiclink')
    auth.state = 'authenticated'
    auth.session = { userId: 'user-1', accessToken: 'token', expiresAt: 0, handle: 'battle_benny' }
    auth.profile = { id: 'user-1', handle: 'battle_benny' }

    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('Connexion réussie. Heureux de te revoir !')
  })

  it('explains when a magic-link connection has expired', () => {
    window.history.replaceState({}, '', '/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')

    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('Ce lien de connexion a expiré. Demande-en un nouveau.')
  })

  it('closes the sign-in sheet once authentication completes', () => {
    const { container, rerender } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Profil' }))
    expect(screen.getByRole('dialog', { name: 'Connexion Loodi' })).toBeInTheDocument()

    auth.state = 'authenticated'
    auth.session = { userId: 'user-1', accessToken: 'token', expiresAt: 0, handle: 'battle_benny' }
    rerender(<App />)

    expect(screen.queryByRole('dialog', { name: 'Connexion Loodi' })).not.toBeInTheDocument()
  })

  it('closes the sign-in sheet when its handle is dragged down', () => {
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Profil' }))
    const handle = screen.getByTestId('auth-sheet-handle')
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 210 })
    expect(handle.closest('form')).toHaveStyle({ transform: 'translateY(110px)' })
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 210 })

    expect(screen.queryByRole('dialog', { name: 'Connexion Loodi' })).not.toBeInTheDocument()
  })

  it('closes the sign-in sheet opened from an anonymous Loodi account', () => {
    shellSettings.open = true
    shellSettings.page = 'account'
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /j’ai déjà un compte/i }))
    const handle = screen.getByTestId('auth-sheet-handle')
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 210 })
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 210 })

    expect(screen.queryByRole('dialog', { name: 'Connexion Loodi' })).not.toBeInTheDocument()
  })

  it('prevents a second magic-link request while the first one is being sent', () => {
    let resolveRequest!: () => void
    signInWithMagicLink.mockImplementation(() => new Promise<void>((resolve) => { resolveRequest = resolve }))
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Profil' }))
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'hello@loodi.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Recevoir un lien magique' }))

    expect(screen.getByRole('button', { name: 'Envoi…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Continuer avec Google' })).toBeDisabled()
    resolveRequest()
  })
})

import { fireEvent, render, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

const sendHeaderAction = vi.hoisted(() => vi.fn())
const sendBack = vi.hoisted(() => vi.fn())
const goBack = vi.hoisted(() => vi.fn())
const registerIframe = vi.hoisted(() => vi.fn())
const shellSettings = vi.hoisted(() => ({ open: false }))
const shellHeaderOptions = vi.hoisted(() => ({ hideActions: false, canGoBack: false }))
const shellActiveApp = vi.hoisted(() => ({ id: 'loodi-dev' }))

vi.mock('../useShell', () => ({
  shouldRetryModule: () => false,
  useShell: () => ({
    state: {
      activeAppId: shellActiveApp.id,
      apps: [{ id: 'loodi-dev', name: 'Dev', icon: '⚙️', color: '#6B7280', url: 'https://dummy.loodi.test:4000' }],
      tabs: [],
      activeTab: null,
      headerActions: [{ id: 'new-game', label: 'Nouveau jeu' }],
      headerOptions: shellHeaderOptions,
      settingsOpen: shellSettings.open,
      launcherOpen: false,
    },
    themeMode: 'auto',
    setThemeMode: vi.fn(),
    toggleLauncher: vi.fn(),
    activateApp: vi.fn(),
    toggleSettings: vi.fn(),
    registerIframe,
    goBack,
    overlayActive: false,
    scrollProgress: 0,
    lastUsedAppId: { current: 'loodi-dev' },
    favoriteAppId: null,
    setFavoriteAppId: vi.fn(),
    isLocalBuild: true,
    localModuleUrls: {},
    setLocalModuleUrls: vi.fn(),
    readyAppIds: new Set<string>(),
    sendHeaderAction,
    sendBack,
  }),
}))

describe('module frame', () => {
  beforeEach(() => {
    shellSettings.open = false
    shellHeaderOptions.hideActions = false
    shellHeaderOptions.canGoBack = false
    shellActiveApp.id = 'loodi-dev'
    sendHeaderAction.mockClear()
    sendBack.mockClear()
    goBack.mockClear()
    registerIframe.mockClear()
    document.documentElement.style.setProperty('--safe-area-inset-top', '24px')
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '16px')
  })

  afterEach(() => {
    document.documentElement.style.removeProperty('--safe-area-inset-top')
    document.documentElement.style.removeProperty('--safe-area-inset-bottom')
  })

  it('passes the header and bottom-navigation clearances to modules', () => {
    const { container } = render(<App />)
    const frame = container.querySelector<HTMLIFrameElement>('iframe[data-app="loodi-dev"]')!
    const url = new URL(frame.src)

    expect(url.searchParams.get('headerHeight')).toBe('76')
    expect(url.searchParams.get('bottomNavHeight')).toBe('88')
    expect(url.searchParams.get('viewportSafeArea')).toBe('1')
    expect(frame).toHaveStyle({
      top: '76px',
      bottom: '88px',
      height: 'calc(100% - 164px)',
    })
  })

  it('keeps iframe refs stable across renders to avoid repeated registrations', () => {
    const { rerender } = render(<App />)

    expect(registerIframe).toHaveBeenCalledTimes(1)

    rerender(<App />)

    expect(registerIframe).toHaveBeenCalledTimes(1)
  })

  it('lets the dev dummy apply both shell clearances as body padding', () => {
    const dummy = readFileSync(resolve(process.cwd(), 'public/dev/dummy.html'), 'utf8')

    expect(dummy).toContain('--shell-safe-top')
    expect(dummy).toContain('--shell-safe-bottom')
    expect(dummy).toContain("shellClearance('bottomNavHeight')")
    expect(dummy).toContain("shellParams.get('viewportSafeArea') === '1'")
  })

  it('shows declared module actions and returns the selected action to the module', () => {
    const { container } = render(<App />)

    fireEvent.click(within(container).getByRole('button', { name: 'Plus' }))
    expect(within(container).getByRole('button', { name: 'Paramètres' })).toBeInTheDocument()
    fireEvent.click(within(container).getByRole('button', { name: 'Nouveau jeu' }))

    expect(sendHeaderAction).toHaveBeenCalledWith('new-game')
  })

  it('hides profile and more actions while settings are open', () => {
    shellSettings.open = true
    const { container } = render(<App />)

    expect(within(container).queryByRole('button', { name: 'Profil' })).not.toBeInTheDocument()
    expect(within(container).queryByRole('button', { name: 'Plus' })).not.toBeInTheDocument()
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

    expect(backButton).toHaveClass('opacity-100')
    fireEvent.click(backButton)
    expect(sendBack).toHaveBeenCalledOnce()
    expect(goBack).not.toHaveBeenCalled()

    shellHeaderOptions.canGoBack = false
    rerender(<App />)

    expect(within(container).getByRole('button', { name: 'Retour' })).toHaveClass('opacity-0')
  })
})

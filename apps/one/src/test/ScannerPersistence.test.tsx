import { act, render, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

const COLLEC_ORIGIN = 'https://collec.loodi.test:4002'
const collecTabs = [
  { id: 'home', icon: 'home', label: 'Accueil' },
  { id: 'catalog', icon: 'search', label: 'Collection' },
  { id: 'scanner', icon: 'scan', label: 'Scanner' },
  { id: 'loans', icon: 'rss', label: 'Prêts' },
]

function dispatchFromCollec(source: WindowProxy, data: object) {
  window.dispatchEvent(new MessageEvent('message', { source, origin: COLLEC_ORIGIN, data }))
}

describe('Collec scanner persistence', () => {
  beforeEach(() => {
    const storage = new Map([['loodi:lastApp', 'loodi']])
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { storage.set(key, value) }),
      removeItem: vi.fn((key: string) => { storage.delete(key) }),
    })
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
    document.documentElement.style.setProperty('--safe-area-inset-top', '24px')
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '16px')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.documentElement.style.removeProperty('--safe-area-inset-top')
    document.documentElement.style.removeProperty('--safe-area-inset-bottom')
  })

  it('does not treat a delayed bridge handshake as a reason to recreate Collec', () => {
    vi.useFakeTimers()
    const { container } = render(<App />)
    const frame = container.querySelector<HTMLIFrameElement>('iframe[data-app="loodi"]')!
    const initialSrc = frame.src

    act(() => { vi.advanceTimersByTime(2_000) })

    expect(container.querySelector('iframe[data-app="loodi"]')).toBe(frame)
    expect(frame.src).toBe(initialSrc)
  })

  it('keeps the Collec runtime while scanning, changing camera state and returning from manual entry', () => {
    const { container } = render(<App />)
    const frame = container.querySelector<HTMLIFrameElement>('iframe[data-app="loodi"]')!
    const source = frame.contentWindow!
    const initialSrc = frame.src
    const initialUrl = new URL(initialSrc)
    const header = container.querySelector<HTMLElement>('header.loodi-mini-header')!

    expect(frame).toHaveAttribute('allow', 'camera')
    expect(initialUrl.searchParams.get('headerHeight')).toBe('76')
    expect(initialUrl.searchParams.get('bottomNavHeight')).toBe('88')
    expect(frame).toHaveClass('inset-0', 'w-full', 'h-full')
    expect(header).toHaveStyle({
      height: 'calc(52px + var(--safe-area-inset-top))',
      paddingTop: 'var(--safe-area-inset-top)',
    })

    act(() => {
      dispatchFromCollec(source, { type: 'loodi:ready' })
      dispatchFromCollec(source, {
        type: 'loodi:call', method: 'setBottomNav', args: [collecTabs], id: 1,
      })
      dispatchFromCollec(source, { type: 'loodi:navigate', path: '/scanner' })
      dispatchFromCollec(source, {
        type: 'loodi:call', method: 'setBottomNav', args: [[]], id: 2,
      })
    })

    expect(within(container).getByRole('navigation')).toHaveClass('loodi-bottom-nav--hidden')
    expect(container.querySelector('iframe[data-app="loodi"]')).toBe(frame)

    act(() => {
      dispatchFromCollec(source, {
        type: 'loodi:call', method: 'setBottomNav', args: [collecTabs], id: 3,
      })
      dispatchFromCollec(source, {
        type: 'loodi:event', event: 'loodi:overlaychange', detail: { visible: true },
      })
      dispatchFromCollec(source, {
        type: 'loodi:event', event: 'loodi:error', detail: { code: 'CAMERA_DENIED', recoverable: true },
      })
      dispatchFromCollec(source, { type: 'loodi:navigate', path: '/scanner/manual' })
      dispatchFromCollec(source, {
        type: 'loodi:event', event: 'loodi:overlaychange', detail: { visible: false },
      })
      dispatchFromCollec(source, { type: 'loodi:navigate', path: '/catalog' })

      // A camera permission sheet can update visual viewport/safe-area values.
      // This must only relayout One, never navigate the module iframe.
      document.documentElement.style.setProperty('--safe-area-inset-top', '0px')
      window.dispatchEvent(new Event('resize'))
    })

    expect(container.querySelector('iframe[data-app="loodi"]')).toBe(frame)
    expect(frame.src).toBe(initialSrc)
    expect(frame).toHaveAttribute('allow', 'camera')
    expect(within(container).getByRole('navigation')).not.toHaveClass('loodi-bottom-nav--hidden')
    expect(within(container).getByRole('button', { name: 'Collection' })).toBeInTheDocument()
  })
})

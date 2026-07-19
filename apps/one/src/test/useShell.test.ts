import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getActiveTabForPath, getInitialAppId, getModuleHeaderOptions, getModuleTabs, registerRenderedModules, useShell } from '../useShell'

describe('registerRenderedModules', () => {
  it('re-registers mounted iframes when the bridge is recreated', () => {
    const registerModule = vi.fn()
    const container = document.createElement('div')
    const loodi = document.createElement('iframe')
    loodi.dataset.app = 'loodi'
    const mate = document.createElement('iframe')
    mate.dataset.app = 'loodi-mate'
    container.append(loodi, mate)

    registerRenderedModules({ registerModule }, container)

    expect(registerModule).toHaveBeenCalledWith('loodi', loodi)
    expect(registerModule).toHaveBeenCalledWith('loodi-mate', mate)
  })
})

describe('getInitialAppId', () => {
  it('ignores a persisted module that is absent or unavailable in the current build', () => {
    const apps = [
      { id: 'loodi', name: 'Loodi', icon: '🎲', url: 'https://loodi.vercel.app', color: '#ca4a16' },
      { id: 'loodi-mate', name: 'Mate', icon: '🃏', url: null, color: '#2E8B57' },
    ]

    expect(getInitialAppId(apps, 'loodi-dev', 'loodi-dev')).toBe('loodi')
  })
})

describe('getModuleTabs', () => {
  it('restores the tabs received from an inactive module when it becomes active', () => {
    const tabs = [{ id: 'catalog', icon: 'search', label: 'Collection' }]
    const tabsByApp = new Map([['loodi', tabs]])

    expect(getModuleTabs(tabsByApp, 'loodi')).toEqual(tabs)
  })

  it('returns no tabs until a module has sent its navigation', () => {
    expect(getModuleTabs(new Map(), 'loodi')).toEqual([])
  })
})

describe('getModuleHeaderOptions', () => {
  it('restores the header options declared by the application being activated', () => {
    const optionsByApp = new Map([
      ['loodi', { hideActions: true, canGoBack: true }],
      ['loodi-mate', { hideActions: false, canGoBack: false }],
    ])

    expect(getModuleHeaderOptions(optionsByApp, 'loodi')).toEqual({ hideActions: true, canGoBack: true })
    expect(getModuleHeaderOptions(optionsByApp, 'loodi-mate')).toEqual({ hideActions: false, canGoBack: false })
  })

  it('shows header actions by default for an application with no options', () => {
    expect(getModuleHeaderOptions(new Map(), 'loodi')).toEqual({ hideActions: false, canGoBack: false })
  })
})

describe('getActiveTabForPath', () => {
  it('maps Collec pages to the matching shell tab', () => {
    expect(getActiveTabForPath('/catalog')).toBe('catalog')
    expect(getActiveTabForPath('/game/codex-naturalis')).toBe('catalog')
    expect(getActiveTabForPath('/scanner')).toBe('scanner')
    expect(getActiveTabForPath('/loans')).toBe('loans')
  })
})

describe('module overlays', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('only hides the bottom navigation for an overlay in the active module', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
    const { result } = renderHook(() => useShell())
    const activeModuleId = result.current.state.activeAppId
    const activeWindow = { postMessage: vi.fn() } as unknown as WindowProxy
    const inactiveWindow = { postMessage: vi.fn() } as unknown as WindowProxy
    const activeFrame = document.createElement('iframe')
    const inactiveFrame = document.createElement('iframe')
    activeFrame.src = 'https://collec.loodi.test:4002/catalog'
    inactiveFrame.src = 'https://dummy.loodi.test:4000/dev'
    Object.defineProperty(activeFrame, 'contentWindow', { value: activeWindow })
    Object.defineProperty(inactiveFrame, 'contentWindow', { value: inactiveWindow })

    act(() => {
      result.current.registerIframe(activeModuleId, activeFrame)
      result.current.registerIframe('loodi-mate', inactiveFrame)
      window.dispatchEvent(new MessageEvent('message', {
        source: inactiveWindow,
        origin: 'https://dummy.loodi.test:4000',
        data: { type: 'loodi:event', event: 'loodi:overlaychange', detail: { visible: true } },
      }))
    })

    expect(result.current.overlayActive).toBe(false)

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        source: activeWindow,
        origin: 'https://collec.loodi.test:4002',
        data: { type: 'loodi:event', event: 'loodi:overlaychange', detail: { visible: true } },
      }))
    })

    expect(result.current.overlayActive).toBe(true)

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        source: activeWindow,
        origin: 'https://collec.loodi.test:4002',
        data: { type: 'loodi:event', event: 'loodi:overlaychange', detail: { visible: false } },
      }))
    })

    expect(result.current.overlayActive).toBe(false)
  })
})

describe('strict bridge runtime', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.querySelectorAll('iframe[data-app]').forEach((iframe) => iframe.remove())
  })

  it('uses the registered iframe origin for ready and theme messages', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => key === 'loodi:lastApp' ? 'loodi' : null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
    const { result } = renderHook(() => useShell())
    const iframe = document.createElement('iframe')
    iframe.dataset.app = 'loodi'
    iframe.src = 'https://collec.loodi.test:4002/catalog'
    const child = { postMessage: vi.fn() } as unknown as WindowProxy
    Object.defineProperty(iframe, 'contentWindow', { value: child })
    document.body.append(iframe)

    act(() => {
      result.current.registerIframe('loodi', iframe)
      window.dispatchEvent(new MessageEvent('message', {
        source: child,
        origin: 'https://dummy.loodi.test:4000',
        data: { type: 'loodi:ready' },
      }))
    })

    expect(result.current.readyAppIds).not.toContain('loodi')

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        source: child,
        origin: 'https://collec.loodi.test:4002',
        data: { type: 'loodi:ready' },
      }))
      result.current.setThemeMode('dark')
    })

    expect(result.current.readyAppIds).toContain('loodi')
    expect(child.postMessage).toHaveBeenLastCalledWith({
      type: 'loodi:event',
      event: 'loodi:themechange',
      detail: { theme: 'dark' },
    }, 'https://collec.loodi.test:4002')
  })
})

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getActiveTabForPath, getModuleHeaderOptions, getModuleTabs, registerRenderedModules, shouldRetryModule, useShell } from '../useShell'

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

describe('shouldRetryModule', () => {
  it('retries a module that has not completed its bridge handshake', () => {
    expect(shouldRetryModule('loodi', new Set(), new Set())).toBe(true)
  })

  it('does not retry a ready module or a module already retried', () => {
    expect(shouldRetryModule('loodi', new Set(['loodi']), new Set())).toBe(false)
    expect(shouldRetryModule('loodi', new Set(), new Set(['loodi']))).toBe(false)
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
    Object.defineProperty(activeFrame, 'contentWindow', { value: activeWindow })
    Object.defineProperty(inactiveFrame, 'contentWindow', { value: inactiveWindow })

    act(() => {
      result.current.registerIframe(activeModuleId, activeFrame)
      result.current.registerIframe('loodi-mate', inactiveFrame)
      window.dispatchEvent(new MessageEvent('message', {
        source: inactiveWindow,
        data: { type: 'loodi:event', event: 'loodi:overlaychange', detail: { visible: true } },
      }))
    })

    expect(result.current.overlayActive).toBe(false)

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        source: activeWindow,
        data: { type: 'loodi:event', event: 'loodi:overlaychange', detail: { visible: true } },
      }))
    })

    expect(result.current.overlayActive).toBe(true)

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        source: activeWindow,
        data: { type: 'loodi:event', event: 'loodi:overlaychange', detail: { visible: false } },
      }))
    })

    expect(result.current.overlayActive).toBe(false)
  })
})

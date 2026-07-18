import { describe, expect, it, vi } from 'vitest'
import { BridgeServer } from '../BridgeServer'

function callbacks() {
  return {
    onReady: vi.fn(),
    onBadgeCount: vi.fn(),
    onError: vi.fn(),
    onTabsChange: vi.fn(),
    onHeaderActionsChange: vi.fn(),
    onHeaderOptionsChange: vi.fn(),
    onNavigate: vi.fn(),
    onOverlayChange: vi.fn(),
    onScroll: vi.fn(),
    onRequestOpenApp: vi.fn(),
    onRequestCloseApp: vi.fn(),
    onRequestShowSwitcher: vi.fn(),
  }
}

describe('BridgeServer header actions', () => {
  it('stores the actions declared by a module', () => {
    const cb = callbacks()
    const bridge = new BridgeServer(cb)
    const iframe = document.createElement('iframe')
    const child = { postMessage: vi.fn() } as unknown as WindowProxy
    Object.defineProperty(iframe, 'contentWindow', { value: child })
    bridge.registerModule('loodi', iframe)

    const actions = [{ id: 'new-game', label: 'Nouveau jeu' }]
    window.dispatchEvent(new MessageEvent('message', {
      source: child,
      data: { type: 'loodi:call', method: 'setHeaderActions', args: [actions], id: 1 },
    }))

    expect(cb.onHeaderActionsChange).toHaveBeenCalledWith('loodi', actions)
    bridge.destroy()
  })

  it('sends the selected header action back to its declaring module', () => {
    const bridge = new BridgeServer(callbacks())
    const iframe = document.createElement('iframe')
    const postMessage = vi.fn()
    Object.defineProperty(iframe, 'contentWindow', { value: { postMessage } })
    bridge.registerModule('loodi', iframe)

    bridge.sendHeaderAction('loodi', 'delete-game')

    expect(postMessage).toHaveBeenCalledWith({
      type: 'loodi:event',
      event: 'loodi:headeraction',
      detail: { id: 'delete-game' },
    }, '*')
    bridge.destroy()
  })
})

describe('BridgeServer header options', () => {
  it('stores the options declared by a module', () => {
    const cb = callbacks()
    const bridge = new BridgeServer(cb)
    const iframe = document.createElement('iframe')
    const child = { postMessage: vi.fn() } as unknown as WindowProxy
    Object.defineProperty(iframe, 'contentWindow', { value: child })
    bridge.registerModule('loodi', iframe)

    window.dispatchEvent(new MessageEvent('message', {
      source: child,
      data: { type: 'loodi:call', method: 'setHeaderOptions', args: [{ canGoBack: true }], id: 1 },
    }))

    expect(cb.onHeaderOptionsChange).toHaveBeenCalledWith('loodi', { hideActions: false, canGoBack: true })
    expect(bridge.getModuleInfo('loodi')?.headerOptions).toEqual({ hideActions: false, canGoBack: true })
    bridge.destroy()
  })

  it('sends a back event to the requested module', () => {
    const bridge = new BridgeServer(callbacks())
    const iframe = document.createElement('iframe')
    const postMessage = vi.fn()
    Object.defineProperty(iframe, 'contentWindow', { value: { postMessage } })
    bridge.registerModule('loodi-collec', iframe)

    bridge.sendBack('loodi-collec')

    expect(postMessage).toHaveBeenCalledWith({
      type: 'loodi:event',
      event: 'loodi:back',
      detail: undefined,
    }, '*')
    bridge.destroy()
  })
})

describe('BridgeServer overlays', () => {
  it('accepts the direct overlay event emitted by legacy modules', () => {
    const cb = callbacks()
    const bridge = new BridgeServer(cb)
    const iframe = document.createElement('iframe')
    const child = { postMessage: vi.fn() } as unknown as WindowProxy
    Object.defineProperty(iframe, 'contentWindow', { value: child })
    bridge.registerModule('loodi', iframe)

    window.dispatchEvent(new MessageEvent('message', {
      source: child,
      data: { type: 'loodi:overlaychange', visible: true },
    }))

    expect(cb.onOverlayChange).toHaveBeenCalledWith('loodi', true)
    bridge.destroy()
  })
})

describe('BridgeServer module navigation contract', () => {
  it('accepts the legacy ready and navigate messages from a registered module', () => {
    const cb = callbacks()
    const bridge = new BridgeServer(cb)
    const iframe = document.createElement('iframe')
    const child = { postMessage: vi.fn() } as unknown as WindowProxy
    Object.defineProperty(iframe, 'contentWindow', { value: child })
    bridge.registerModule('loodi', iframe)

    window.dispatchEvent(new MessageEvent('message', {
      source: child,
      data: { type: 'loodi:ready' },
    }))
    window.dispatchEvent(new MessageEvent('message', {
      source: child,
      data: { type: 'loodi:navigate', path: '/scanner' },
    }))

    expect(cb.onReady).toHaveBeenCalledWith('loodi')
    expect(cb.onNavigate).toHaveBeenCalledWith('loodi', '/scanner')
    bridge.destroy()
  })

  it('keeps an empty module tab list empty and forwards four declared Collec tabs without adding one', () => {
    const cb = callbacks()
    const bridge = new BridgeServer(cb)
    const iframe = document.createElement('iframe')
    const child = { postMessage: vi.fn() } as unknown as WindowProxy
    Object.defineProperty(iframe, 'contentWindow', { value: child })
    bridge.registerModule('loodi', iframe)
    const collecTabs = [
      { id: 'home', icon: 'home', label: 'Accueil' },
      { id: 'catalog', icon: 'search', label: 'Collection' },
      { id: 'scanner', icon: 'scan', label: 'Scanner' },
      { id: 'loans', icon: 'rss', label: 'Prêts' },
    ]

    window.dispatchEvent(new MessageEvent('message', {
      source: child,
      data: { type: 'loodi:call', method: 'setBottomNav', args: [[]], id: 1 },
    }))
    window.dispatchEvent(new MessageEvent('message', {
      source: child,
      data: { type: 'loodi:call', method: 'setBottomNav', args: [collecTabs], id: 2 },
    }))

    expect(cb.onTabsChange).toHaveBeenNthCalledWith(1, 'loodi', [])
    expect(cb.onTabsChange).toHaveBeenNthCalledWith(2, 'loodi', collecTabs)
    expect(cb.onTabsChange).toHaveBeenCalledTimes(2)
    bridge.destroy()
  })
})

describe('BridgeServer optional strict transport validation', () => {
  it('requires a known source, schema-valid message and allowlisted origin, then targets the module origin', () => {
    const cb = callbacks()
    const bridge = new BridgeServer(cb, {
      security: {
        mode: 'strict',
        allowedOrigins: ['https://collec.loodi.test'],
      },
    })
    const iframe = document.createElement('iframe')
    iframe.src = 'https://collec.loodi.test/catalog'
    const postMessage = vi.fn()
    const child = { postMessage } as unknown as WindowProxy
    Object.defineProperty(iframe, 'contentWindow', { value: child })
    bridge.registerModule('loodi', iframe)

    window.dispatchEvent(new MessageEvent('message', {
      source: child,
      origin: 'https://untrusted.example',
      data: { type: 'loodi:ready' },
    }))
    window.dispatchEvent(new MessageEvent('message', {
      source: {} as WindowProxy,
      origin: 'https://collec.loodi.test',
      data: { type: 'loodi:ready' },
    }))
    window.dispatchEvent(new MessageEvent('message', {
      source: child,
      origin: 'https://collec.loodi.test',
      data: { type: 'loodi:navigate', path: 42 },
    }))
    window.dispatchEvent(new MessageEvent('message', {
      source: child,
      origin: 'https://collec.loodi.test',
      data: { type: 'loodi:ready' },
    }))
    bridge.sendBack('loodi')

    expect(cb.onReady).toHaveBeenCalledExactlyOnceWith('loodi')
    expect(cb.onNavigate).not.toHaveBeenCalled()
    expect(postMessage).toHaveBeenCalledWith({
      type: 'loodi:event',
      event: 'loodi:back',
      detail: undefined,
    }, 'https://collec.loodi.test')
    bridge.destroy()
  })
})

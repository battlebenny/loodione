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

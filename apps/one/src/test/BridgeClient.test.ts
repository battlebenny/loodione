import { afterEach, describe, expect, it, vi } from 'vitest'
import { BridgeClient, isBridgeProtocolMessage } from '@loodi/bridge'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BridgeClient header options', () => {
  it('forwards the global authentication sheet request', async () => {
    const bridge = new BridgeClient()
    const call = vi.spyOn(bridge, 'call').mockResolvedValue(undefined)

    await bridge.showAuth()

    expect(call).toHaveBeenCalledWith('showAuth')
  })

  it('forwards bottom navigation through the typed bridge method', async () => {
    const bridge = new BridgeClient()
    const call = vi.spyOn(bridge, 'call').mockResolvedValue(undefined)

    await bridge.setBottomNav([{ id: 'home', icon: 'home', label: 'Accueil' }])

    expect(call).toHaveBeenCalledWith('setBottomNav', [{ id: 'home', icon: 'home', label: 'Accueil' }])
  })

  it('forwards header options through the typed bridge method', async () => {
    const bridge = new BridgeClient()
    const call = vi.spyOn(bridge, 'call').mockResolvedValue(undefined)

    await bridge.setHeaderOptions({ hideActions: true })

    expect(call).toHaveBeenCalledWith('setHeaderOptions', { hideActions: true })
  })

  it('forwards navigation gesture capability through the typed bridge method', async () => {
    const bridge = new BridgeClient()
    const call = vi.spyOn(bridge, 'call').mockResolvedValue(undefined)

    await bridge.setNavigationGestureCapability(true)

    expect(call).toHaveBeenCalledWith('setNavigationGestureCapability', true)
  })

  it('strictly validates navigation request and result event payloads', () => {
    expect(isBridgeProtocolMessage({
      type: 'loodi:event',
      event: 'loodi:navigationrequest',
      detail: { requestId: 'navigation-1', direction: 'back', source: 'gesture' },
    })).toBe(true)
    expect(isBridgeProtocolMessage({
      type: 'loodi:event',
      event: 'loodi:navigationresult',
      detail: { requestId: 'navigation-1', handled: 'yes' },
    })).toBe(false)
  })

  it('keeps the legacy module-to-shell event contract available', () => {
    const bridge = new BridgeClient()

    bridge.emit('loodi:badgecount', { count: 2 })
    bridge.emit('loodi:error', { code: 'NETWORK', recoverable: true })
    bridge.emit('loodi:overlaychange', { visible: true })
    bridge.emit('loodi:scroll', { scrollY: 24 })

    bridge.destroy()
  })
})

describe('BridgeClient navigation compatibility', () => {
  it('keeps ready and navigate as no-ops when the module runs standalone', () => {
    const bridge = new BridgeClient()

    expect(bridge.ready()).toBeUndefined()
    expect(bridge.navigate('/catalog')).toBeUndefined()

    bridge.destroy()
  })

  it('sends the existing legacy ready and navigate messages to an explicit shell origin', () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})
    const bridge = new BridgeClient({
      targetOrigin: 'https://one.loodi.test',
      security: { mode: 'strict' },
    })
    Object.defineProperty(bridge, 'mode', { value: 'iframe' })

    bridge.ready()
    bridge.navigate('/scanner')

    expect(postMessage).toHaveBeenNthCalledWith(1, { type: 'loodi:ready' }, 'https://one.loodi.test')
    expect(postMessage).toHaveBeenNthCalledWith(2, { type: 'loodi:navigate', path: '/scanner' }, 'https://one.loodi.test')
    bridge.destroy()
  })

  it('only accepts schema-valid shell events from the configured parent origin in strict mode', () => {
    const bridge = new BridgeClient({
      targetOrigin: 'https://one.loodi.test',
      security: { mode: 'strict' },
    })
    const onMessage = (bridge as unknown as { onMessage: (event: MessageEvent) => void }).onMessage
    const onThemeChange = vi.fn()
    bridge.on('loodi:themechange', onThemeChange)

    onMessage({
      source: window.parent,
      origin: 'https://one.loodi.test',
      data: { type: 'loodi:event', event: 'loodi:themechange', detail: { theme: 'dark' } },
    } as MessageEvent)
    onMessage({
      source: window.parent,
      origin: 'https://untrusted.example',
      data: { type: 'loodi:event', event: 'loodi:themechange', detail: { theme: 'light' } },
    } as MessageEvent)
    onMessage({
      source: window.parent,
      origin: 'https://one.loodi.test',
      data: { type: 'loodi:event', event: 'loodi:themechange', detail: { theme: 'unexpected' } },
    } as MessageEvent)

    expect(onThemeChange).toHaveBeenCalledExactlyOnceWith({ theme: 'dark' })
    bridge.destroy()
  })
})

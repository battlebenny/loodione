import { describe, expect, it, vi } from 'vitest'
import { BridgeClient } from '@loodi/bridge'

describe('BridgeClient header options', () => {
  it('forwards header options through the typed bridge method', async () => {
    const bridge = new BridgeClient()
    const call = vi.spyOn(bridge, 'call').mockResolvedValue(undefined)

    await bridge.setHeaderOptions({ hideActions: true })

    expect(call).toHaveBeenCalledWith('setHeaderOptions', { hideActions: true })
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

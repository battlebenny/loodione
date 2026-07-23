import { describe, expect, it, vi } from 'vitest'
import { handleNavigationRequest, installNavigationRuntime } from '../navigation'

describe('navigation gesture fallback', () => {
  it('keeps the browser and iOS shell open when back is not handled', async () => {
    const exit = vi.fn()
    await handleNavigationRequest({ platform: 'web', direction: 'back', source: 'gesture', request: async () => false, exit })
    await handleNavigationRequest({ platform: 'ios', direction: 'back', source: 'system', request: async () => false, exit })
    expect(exit).not.toHaveBeenCalled()
  })

  it('exits One only for an unhandled Android back request', async () => {
    const exit = vi.fn()
    await handleNavigationRequest({ platform: 'android', direction: 'back', source: 'system', request: async () => false, exit })
    expect(exit).toHaveBeenCalledOnce()
  })

  it('does not exit for forward, timeouts, invalid answers, or handled module navigation', async () => {
    const exit = vi.fn()
    await handleNavigationRequest({ platform: 'android', direction: 'forward', source: 'gesture', request: async () => false, exit })
    await handleNavigationRequest({ platform: 'android', direction: 'back', source: 'system', request: async () => { throw new Error('timeout') }, exit })
    await handleNavigationRequest({ platform: 'android', direction: 'back', source: 'gesture', request: async () => true, exit })
    expect(exit).not.toHaveBeenCalled()
  })

  it('intercepts a browser gesture before its default behavior and delegates it', async () => {
    const request = vi.fn(async () => true)
    const uninstall = installNavigationRuntime('web', request, vi.fn())
    const event = new CustomEvent('loodi:navigationgesture', {
      cancelable: true,
      detail: { direction: 'forward' },
    })

    window.dispatchEvent(event)
    await Promise.resolve()

    expect(event.defaultPrevented).toBe(true)
    expect(request).toHaveBeenCalledWith('forward', 'gesture')
    uninstall()
  })
})

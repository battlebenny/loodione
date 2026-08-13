import { beforeEach, describe, expect, it, vi } from 'vitest'

const vitePwa = vi.hoisted(() => vi.fn())

vi.mock('vite-plugin-pwa', () => ({
  VitePWA: vitePwa,
}))

import { createLoodiPwaPlugin } from './vite.js'

describe('createLoodiPwaPlugin', () => {
  beforeEach(() => {
    vitePwa.mockReset()
    vitePwa.mockReturnValue([{ name: 'vite-plugin-pwa' }])
  })

  it('creates a prompt PWA plugin with standard manifest and no business cache', () => {
    const plugin = createLoodiPwaPlugin({
      appName: 'Friends',
      description: 'Le réseau de joueurs Loodi',
      themeColor: '#D84A77',
    })

    const plugins = Array.isArray(plugin) ? plugin : [plugin]
    expect(plugins.some((entry) => entry && typeof entry === 'object' && 'name' in entry && entry.name === 'vite-plugin-pwa')).toBe(true)
    expect(vitePwa).toHaveBeenCalledWith(expect.objectContaining({
      devOptions: { enabled: false },
    }))
  })

  it('enables the Vite PWA development service worker only when opted in', () => {
    createLoodiPwaPlugin({ appName: 'Collec', development: true })

    expect(vitePwa).toHaveBeenCalledWith(expect.objectContaining({
      devOptions: { enabled: true },
    }))
  })
})

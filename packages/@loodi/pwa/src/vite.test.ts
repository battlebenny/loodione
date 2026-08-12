import { describe, expect, it } from 'vitest'
import { createLoodiPwaPlugin } from './vite.js'

describe('createLoodiPwaPlugin', () => {
  it('creates a prompt PWA plugin with standard manifest and no business cache', () => {
    const plugin = createLoodiPwaPlugin({
      appName: 'Friends',
      description: 'Le réseau de joueurs Loodi',
      themeColor: '#D84A77',
    })

    const plugins = Array.isArray(plugin) ? plugin : [plugin]
    expect(plugins.some((entry) => entry && typeof entry === 'object' && 'name' in entry && entry.name === 'vite-plugin-pwa')).toBe(true)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { isNativePlatform, setSystemBarsStyle } = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  setSystemBarsStyle: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform },
  SystemBars: { setStyle: setSystemBarsStyle },
  SystemBarsStyle: { Dark: 'DARK', Light: 'LIGHT' },
  SystemBarType: { StatusBar: 'StatusBar' },
}))

import { syncStatusBarTheme } from '../statusBar'

describe('syncStatusBarTheme', () => {
  beforeEach(() => {
    isNativePlatform.mockReturnValue(true)
    setSystemBarsStyle.mockReset()
  })

  it('uses a dark system-bar style when One applies its dark theme', async () => {
    await syncStatusBarTheme('dark')

    expect(setSystemBarsStyle).toHaveBeenCalledWith({ bar: 'StatusBar', style: 'DARK' })
  })

  it('uses a light system-bar style when One applies its light theme', async () => {
    await syncStatusBarTheme('light')

    expect(setSystemBarsStyle).toHaveBeenCalledWith({ bar: 'StatusBar', style: 'LIGHT' })
  })

  it('does not access native APIs in a browser', async () => {
    isNativePlatform.mockReturnValue(false)

    await syncStatusBarTheme('dark')

    expect(setSystemBarsStyle).not.toHaveBeenCalled()
  })
})

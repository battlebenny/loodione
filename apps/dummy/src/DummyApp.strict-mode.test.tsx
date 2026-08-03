import { StrictMode } from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const generatedBridge = vi.hoisted(() => ({
  call: vi.fn().mockResolvedValue(undefined),
  ready: vi.fn(),
  destroy: vi.fn(),
  setBottomNav: vi.fn().mockResolvedValue(undefined),
  setHeaderOptions: vi.fn().mockResolvedValue(undefined),
  setSettingsCapability: vi.fn().mockResolvedValue(undefined),
  getSharedPreferences: vi.fn().mockResolvedValue({ themeMode: 'system', resolvedTheme: 'light', revision: 0 }),
  updateSharedPreferences: vi.fn().mockResolvedValue({ themeMode: 'system', resolvedTheme: 'light', revision: 0 }),
  showShellSettings: vi.fn().mockResolvedValue(undefined),
  showLoodiAccount: vi.fn().mockResolvedValue(undefined),
  emit: vi.fn(),
  on: vi.fn(() => vi.fn()),
}))

vi.mock('./bridge', () => ({
  createDummyBridge: vi.fn(() => generatedBridge),
}))

import { DummyApp } from './DummyApp'

describe('DummyApp in Strict Mode', () => {
  afterEach(() => {
    cleanup()
    generatedBridge.destroy.mockClear()
  })

  it('keeps its generated bridge connected across the development effect replay', async () => {
    render(<StrictMode><DummyApp mode="embedded" /></StrictMode>)

    await waitFor(() => expect(generatedBridge.ready).toHaveBeenCalled())

    expect(generatedBridge.destroy).not.toHaveBeenCalled()
  })
})

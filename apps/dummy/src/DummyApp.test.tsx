import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DummyApp, type DummyBridge } from './DummyApp'

function bridge(): DummyBridge {
  return {
    call: vi.fn().mockResolvedValue(undefined),
    ready: vi.fn(),
    destroy: vi.fn(),
    setBottomNav: vi.fn().mockResolvedValue(undefined),
    setHeaderOptions: vi.fn().mockResolvedValue(undefined),
    setSettingsCapability: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(() => vi.fn()),
    emit: vi.fn(),
    getSharedPreferences: vi.fn().mockResolvedValue({ themeMode: 'system', resolvedTheme: 'light', revision: 1 }),
    updateSharedPreferences: vi.fn().mockResolvedValue({ themeMode: 'light', resolvedTheme: 'light', revision: 2 }),
    showShellSettings: vi.fn().mockResolvedValue(undefined),
  }
}

describe('DummyApp', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps the bridge test controls in standalone mode and hides diagnostic logs in essential mode', () => {
    render(<DummyApp mode="standalone" />)

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accueil' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'getUser' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'setBottomNav' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ouvrir l’overlay' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir l’overlay' }))
    expect(screen.getByRole('dialog', { name: 'Overlay de diagnostic' })).toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Overlay de diagnostic' })).getByRole('button', { name: 'Fermer l’overlay' }))
    expect(screen.queryByRole('dialog', { name: 'Overlay de diagnostic' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Paramètres' }))

    expect(screen.getByRole('heading', { name: 'Paramètres' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Préférences' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Langue Français (bientôt disponible)' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Mode des diagnostics' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Essentiel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))
    expect(screen.queryByTestId('dummy-log')).not.toBeInTheDocument()
  })

  it('navigates back from federated settings and opens One-only settings from the dedicated entry', async () => {
    const shellBridge = bridge()
    const listeners = new Map<string, () => void>()
    shellBridge.on.mockImplementation((event, handler) => {
      listeners.set(event, handler as () => void)
      return vi.fn()
    })

    render(<DummyApp mode="embedded" bridge={shellBridge} />)

    await waitFor(() => {
      expect(shellBridge.ready).toHaveBeenCalledOnce()
      expect(shellBridge.setSettingsCapability).toHaveBeenCalledWith(true)
      expect(shellBridge.setBottomNav).toHaveBeenCalledWith([{ id: 'home', icon: 'home', label: 'Accueil' }])
    })
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    act(() => {
      listeners.get('loodi:settingsopen')?.()
    })

    expect(screen.getByRole('heading', { name: 'Paramètres' })).toBeInTheDocument()
    expect(shellBridge.emit).toHaveBeenCalledWith('loodi:settingsopenresult', { opened: true })
    expect(screen.getByRole('heading', { name: 'Diagnostics' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Préférences' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paramètres globaux' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mode des diagnostics' }))
    expect(shellBridge.emit).toHaveBeenCalledWith('loodi:overlaychange', { visible: true })
    fireEvent.click(screen.getByRole('radio', { name: 'Complet' }))
    expect(shellBridge.emit).toHaveBeenCalledWith('loodi:overlaychange', { visible: false })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Thème Auto (clair)' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Thème Auto (clair)' }))
    expect(shellBridge.emit).toHaveBeenCalledWith('loodi:overlaychange', { visible: true })
    fireEvent.click(screen.getByRole('radio', { name: 'Clair' }))
    expect(shellBridge.emit).toHaveBeenCalledWith('loodi:overlaychange', { visible: false })

    fireEvent.click(screen.getByRole('button', { name: 'Autres paramètres' }))
    expect(shellBridge.showShellSettings).toHaveBeenCalledOnce()

    act(() => {
      listeners.get('loodi:back')?.()
    })
    expect(screen.getByRole('heading', { name: 'Accueil' })).toBeInTheDocument()
  })

  it('always gives an embedded module a way to release the shell navigation overlay', async () => {
    const shellBridge = bridge()
    render(<DummyApp mode="embedded" bridge={shellBridge} />)

    await waitFor(() => expect(shellBridge.ready).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir l’overlay' }))
    expect(shellBridge.emit).toHaveBeenCalledWith('loodi:overlaychange', { visible: true })
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Overlay de diagnostic' })).getByRole('button', { name: 'Fermer l’overlay' }))
    expect(shellBridge.emit).toHaveBeenCalledWith('loodi:overlaychange', { visible: false })
  })
})

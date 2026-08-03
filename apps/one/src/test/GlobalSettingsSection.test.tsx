import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GlobalSettingsSection } from '@loodi/ui'

describe('GlobalSettingsSection', () => {
  afterEach(cleanup)

  it('can hide the shell-only settings entry for a standalone application', () => {
    const onOpenShellSettings = vi.fn()
    render(<GlobalSettingsSection
      onOpenShellSettings={onOpenShellSettings}
      onOpenLoodiAccount={vi.fn()}
      showShellSettings={false}
    />)

    expect(screen.queryByRole('button', { name: /autres paramètres/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mon compte loodi/i })).toBeInTheDocument()
    expect(onOpenShellSettings).not.toHaveBeenCalled()
  })

  it('keeps the shell settings entry visible by default', () => {
    const onOpenShellSettings = vi.fn()
    render(<GlobalSettingsSection onOpenShellSettings={onOpenShellSettings} onOpenLoodiAccount={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /autres paramètres/i }))
    expect(onOpenShellSettings).toHaveBeenCalledOnce()
  })
})

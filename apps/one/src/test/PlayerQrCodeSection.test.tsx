import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlayerQrCodeSection } from '@loodi/ui'

describe('PlayerQrCodeSection', () => {
  afterEach(cleanup)

  it('renders the player QR code entry and delegates opening to the host', () => {
    const onOpenQrCode = vi.fn()

    render(<PlayerQrCodeSection onOpenQrCode={onOpenQrCode} />)

    expect(screen.getByRole('heading', { name: 'Mon code joueur' })).toBeInTheDocument()
    const entry = screen.getByRole('button', { name: /voir mon qr code/i })
    expect(entry).toHaveAccessibleDescription('Pour rejoindre vos compagnons.')

    fireEvent.click(entry)

    expect(onOpenQrCode).toHaveBeenCalledOnce()
  })

  it('disables the entry without invoking the callback', () => {
    const onOpenQrCode = vi.fn()

    render(<PlayerQrCodeSection disabled onOpenQrCode={onOpenQrCode} />)

    const entry = screen.getByRole('button', { name: /voir mon qr code/i })
    expect(entry).toBeDisabled()

    fireEvent.click(entry)

    expect(onOpenQrCode).not.toHaveBeenCalled()
  })
})

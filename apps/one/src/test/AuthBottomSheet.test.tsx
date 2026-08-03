import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountBottomSheet, AuthBottomSheet } from '@loodi/ui'

afterEach(cleanup)

const authProps = () => ({
  open: true,
  state: 'anonymous' as const,
  onClose: vi.fn(),
  onSignInWithGoogle: vi.fn().mockResolvedValue(undefined),
  onSignInWithMagicLink: vi.fn().mockResolvedValue(undefined),
  onCompleteHandle: vi.fn().mockResolvedValue(undefined),
  onAbandonIncompleteAccount: vi.fn().mockResolvedValue(undefined),
})

describe('shared authentication bottom sheets', () => {
  it('starts Google sign-in once and disables repeated actions while pending', () => {
    let resolve!: () => void
    const props = authProps()
    props.onSignInWithGoogle.mockImplementation(() => new Promise<void>((done) => { resolve = done }))
    render(<AuthBottomSheet {...props} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continuer avec Google' }))

    expect(props.onSignInWithGoogle).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Connexion…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Recevoir un lien magique' })).toBeDisabled()
    resolve()
  })

  it('sends a magic link, exposes success and handles callback errors', async () => {
    const props = authProps()
    const { rerender } = render(<AuthBottomSheet {...props} />)

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'hello@loodi.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Recevoir un lien magique' }))
    await vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Le lien est en route'))
    expect(props.onSignInWithMagicLink).toHaveBeenCalledWith('hello@loodi.test')

    const failing = authProps()
    failing.onSignInWithMagicLink.mockRejectedValue(new Error('Adresse refusée'))
    rerender(<AuthBottomSheet {...failing} />)
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'hello@loodi.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Recevoir un lien magique' }))
    await vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Adresse refusée'))
  })

  it('closes from the backdrop and completes an incomplete account through callbacks', async () => {
    const props = authProps()
    const { rerender } = render(<AuthBottomSheet {...props} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Fermer' })[0])
    expect(props.onClose).toHaveBeenCalledOnce()

    rerender(<AuthBottomSheet {...props} state="handle-required" />)
    fireEvent.change(screen.getByLabelText('Nom de joueur'), { target: { value: 'meeple' } })
    fireEvent.click(screen.getByRole('button', { name: 'C’est parti' }))
    await vi.waitFor(() => expect(props.onCompleteHandle).toHaveBeenCalledWith('meeple'))
  })

  it('opens the account page and confirms before signing out', async () => {
    const onClose = vi.fn()
    const onOpenAccount = vi.fn()
    const onSignOut = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(<AccountBottomSheet open playerName="meeple" onClose={onClose} onOpenAccount={onOpenAccount} onSignOut={onSignOut} />)

    fireEvent.click(screen.getByRole('button', { name: 'Gérer mon compte' }))
    expect(onOpenAccount).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()

    rerender(<AccountBottomSheet open playerName="meeple" onClose={onClose} onOpenAccount={onOpenAccount} onSignOut={onSignOut} />)
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }))
    expect(onSignOut).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }))
    await vi.waitFor(() => expect(onSignOut).toHaveBeenCalledOnce())
  })
})

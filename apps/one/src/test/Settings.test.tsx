import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Settings } from '../Settings'
import { LoodiAccountPage } from '@loodi/ui'

vi.mock('@loodi/auth', () => ({
  useAuth: () => ({
    session: null,
    email: 'joueur@loodi.test',
    hasGoogleIdentity: false,
    updateEmail: vi.fn(),
    linkGoogleIdentity: vi.fn(),
    unlinkGoogleIdentity: vi.fn(),
    deleteAccount: vi.fn(),
  }),
}))

describe('Settings', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('keeps the shared theme preference out of One-only settings', () => {
    render(
      <Settings
        onClose={vi.fn()}
        apps={[]}
        favoriteAppId={null}
        onFavoriteChange={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /thème/i })).not.toBeInTheDocument()
  })

  it('offers the Loodi account from global settings', () => {
    render(<Settings onClose={vi.fn()} apps={[]} favoriteAppId={null} onFavoriteChange={vi.fn()} initialPage="account" />)
    expect(screen.getByRole('heading', { name: /mon compte loodi/i })).toHaveStyle({ textWrap: 'balance' })
  })

  it('opens the Loodi account management page', () => {
    render(<Settings onClose={vi.fn()} apps={[]} favoriteAppId={null} onFavoriteChange={vi.fn()} accountName="battle_benny" initialPage="account" isAuthenticated />)
    expect(screen.getByRole('heading', { name: /mon compte loodi/i })).toBeInTheDocument()
    expect(screen.getByText('@battle_benny')).toBeInTheDocument()
  })

  it('keeps the account danger zone scrollable above the bottom navigation', () => {
    render(<Settings onClose={vi.fn()} apps={[]} favoriteAppId={null} onFavoriteChange={vi.fn()} initialPage="account" />)

    expect(screen.getByTestId('loodi-account-scroll-container')).toHaveStyle({
      paddingBottom: 'calc(6.5rem + var(--safe-area-inset-bottom))',
    })
  })

  it('shows a confirmation toaster after a Google identity is associated', () => {
    render(<Settings onClose={vi.fn()} apps={[]} favoriteAppId={null} onFavoriteChange={vi.fn()} initialPage="account" isAuthenticated accountSuccessMessage="Ton compte Google est maintenant associé." />)

    expect(screen.getByRole('status')).toHaveTextContent('Ton compte Google est maintenant associé.')
  })

  it('groups the player name and e-mail in the identity section', () => {
    render(<Settings onClose={vi.fn()} apps={[]} favoriteAppId={null} onFavoriteChange={vi.fn()} accountName="battle_benny" initialPage="account" isAuthenticated />)

    expect(screen.queryByText('Connexion')).not.toBeInTheDocument()
    expect(screen.getByText('Identité').parentElement).toHaveTextContent('E-mail')
  })

  it('lets a signed-in player choose a profile colour from their identity settings', () => {
    const onUpdateProfileColor = vi.fn().mockResolvedValue(undefined)
    render(<LoodiAccountPage isAuthenticated playerName="battle_benny" profileColor="#A83D16" onCreateAccount={vi.fn()} onSignIn={vi.fn()} onUpdateProfileColor={onUpdateProfileColor} />)

    fireEvent.click(screen.getByRole('button', { name: /couleur de profil/i }))
    expect(screen.getByRole('heading', { name: /couleur de profil/i })).toBeInTheDocument()
    expect(screen.getByText('Choisis une couleur qui te ressemble.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /choisir la couleur/i })).toHaveLength(32)
    expect(screen.getByRole('button', { name: 'Choisir la couleur #F5F5F0' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choisir la couleur #1A1A18' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choisir la couleur #777770' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choisir la couleur #B0AEA6' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Choisir la couleur #4B6A68' }))

    expect(onUpdateProfileColor).toHaveBeenCalledWith('#4B6A68')
  })

  it('previews the selected profile colour with a readable palette icon', () => {
    render(<LoodiAccountPage isAuthenticated playerName="battle_benny" profileColor="#F5F5F0" onCreateAccount={vi.fn()} onSignIn={vi.fn()} onUpdateProfileColor={vi.fn()} />)

    const profileRow = screen.getByRole('button', { name: /couleur de profil/i })
    expect(profileRow.querySelector('.loodi-account__icon--profile-color')).toHaveStyle({
      backgroundColor: '#F5F5F0',
      color: '#1A1A18',
    })
  })

  it('offers Google association from the identity section for an authenticated player', () => {
    const onOverlayChange = vi.fn()
    render(<Settings onClose={vi.fn()} apps={[]} favoriteAppId={null} onFavoriteChange={vi.fn()} initialPage="account" isAuthenticated onOverlayChange={onOverlayChange} />)

    expect(screen.queryByRole('button', { name: 'Retour' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /associer un compte google/i }))
    expect(screen.getByRole('heading', { name: /associer google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continuer avec google/i })).toBeInTheDocument()
    expect(onOverlayChange).toHaveBeenLastCalledWith(true)
    fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Fermer' })[1])
    expect(onOverlayChange).toHaveBeenLastCalledWith(false)
  })

  it('closes the Google sheet before showing an association error', async () => {
    const onOverlayChange = vi.fn()
    render(<LoodiAccountPage isAuthenticated onCreateAccount={vi.fn()} onSignIn={vi.fn()} onLinkGoogleIdentity={vi.fn().mockRejectedValue(new Error('Échec Google'))} onOverlayChange={onOverlayChange} />)

    fireEvent.click(screen.getByRole('button', { name: /associer un compte google/i }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /continuer avec google/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent('Échec Google')
    expect(onOverlayChange).toHaveBeenLastCalledWith(false)
  })

  it('closes an account bottom sheet when its handle is dragged down', () => {
    render(<LoodiAccountPage isAuthenticated onCreateAccount={vi.fn()} onSignIn={vi.fn()} onLinkGoogleIdentity={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /associer un compte google/i }))
    const handle = screen.getByTestId('account-sheet-handle')
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 210 })
    expect(handle.parentElement?.style.getPropertyValue('--sheet-drag-offset')).toBe('110px')
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 210 })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lets a player unlink Google without removing their e-mail identity', () => {
    const onUnlinkGoogleIdentity = vi.fn().mockResolvedValue(undefined)
    render(<LoodiAccountPage isAuthenticated hasGoogleIdentity onCreateAccount={vi.fn()} onSignIn={vi.fn()} onUnlinkGoogleIdentity={onUnlinkGoogleIdentity} />)

    fireEvent.click(screen.getByRole('button', { name: /compte associé/i }))
    expect(screen.getByRole('heading', { name: /dissocier google/i })).toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /dissocier google/i }))
    expect(onUnlinkGoogleIdentity).toHaveBeenCalledOnce()
  })

  it('invites an anonymous player to create an account or sign in', () => {
    const onSignIn = vi.fn()
    render(<Settings onClose={vi.fn()} apps={[]} favoriteAppId={null} onFavoriteChange={vi.fn()} initialPage="account" onSignIn={onSignIn} />)

    expect(screen.getByRole('heading', { name: /bienvenue à la table/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /nom de joueur/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))
    fireEvent.click(screen.getByRole('button', { name: /j’ai déjà un compte/i }))
    expect(onSignIn).toHaveBeenCalledTimes(2)
  })

  it('exposes standalone account actions without relying on the One shell', () => {
    const onCreateAccount = vi.fn()
    const onSignIn = vi.fn()
    render(<LoodiAccountPage isAuthenticated={false} onCreateAccount={onCreateAccount} onSignIn={onSignIn} />)

    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))
    fireEvent.click(screen.getByRole('button', { name: /j’ai déjà un compte/i }))
    expect(onCreateAccount).toHaveBeenCalledOnce()
    expect(onSignIn).toHaveBeenCalledOnce()
  })

  it('keeps sign-out in its connection section and asks for confirmation', () => {
    const onSignOut = vi.fn().mockResolvedValue(undefined)
    render(<LoodiAccountPage isAuthenticated playerName="battle_benny" email="joueur@loodi.test" onCreateAccount={vi.fn()} onSignIn={vi.fn()} onSignOut={onSignOut} />)

    expect(screen.getByText('@battle_benny')).toBeInTheDocument()
    expect(screen.getByText('joueur@loodi.test')).toBeInTheDocument()
    const connectionSection = screen.getByText('Connexion').parentElement
    expect(connectionSection).toHaveTextContent('Se déconnecter')
    expect(connectionSection).toHaveStyle({ marginTop: 'var(--spacing-xl, 20px)' })
    fireEvent.click(screen.getByRole('button', { name: /se déconnecter/i }))
    expect(screen.getByRole('heading', { name: /se déconnecter/i })).toBeInTheDocument()
    expect(onSignOut).not.toHaveBeenCalled()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^se déconnecter$/i }))
    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('requires an explicit confirmation before deleting the account', () => {
    const onDeleteAccount = vi.fn().mockResolvedValue(undefined)
    render(<LoodiAccountPage isAuthenticated onCreateAccount={vi.fn()} onSignIn={vi.fn()} onDeleteAccount={onDeleteAccount} />)

    expect(screen.queryByRole('button', { name: /supprimer le compte/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /la fosse des joueurs damnés/i }))
    expect(screen.getByRole('button', { name: /la fosse des joueurs damnés/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('La fosse des joueurs damnés')).toHaveClass('loodi-account__danger-title')
    expect(screen.getByText('Rien de bon ne t’attend ici.')).toHaveClass('loodi-account__danger-detail')
    fireEvent.click(screen.getByRole('button', { name: /supprimer le compte/i }))
    expect(screen.getByRole('heading', { name: /supprimer le compte/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^supprimer définitivement$/i })).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/écris supprimer/i), { target: { value: 'SUPPRIMER' } })
    fireEvent.click(screen.getByRole('button', { name: /^supprimer définitivement$/i }))

    expect(onDeleteAccount).toHaveBeenCalledOnce()
  })

  it('shows One settings directly when opened from another module', () => {
    render(<Settings onClose={vi.fn()} apps={[]} favoriteAppId={null} onFavoriteChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /application préférée/i })).toBeInTheDocument()
  })

  it('shows editable local module URLs in a development build', async () => {
    render(
      <Settings
        onClose={vi.fn()}
        apps={[]}
        favoriteAppId={null}
        onFavoriteChange={vi.fn()}
        developmentApps={[{ id: 'loodi', name: 'Loodi', icon: '🎲', color: '#ca4a16', url: null }]}
        localModuleUrls={{ loodi: 'https://192.168.1.42:4173' }}
        onLocalModuleUrlsChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /modules locaux/i }))

    expect(await screen.findByRole('textbox', { name: 'Loodi' })).toHaveValue('https://192.168.1.42:4173')
  })
})

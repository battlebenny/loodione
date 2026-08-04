import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MiniHeader } from '@loodi/ui'

describe('MiniHeader', () => {
  it('keeps its controls outside every safe-area inset', () => {
    const { container } = render(
      <MiniHeader
        onSettings={vi.fn()}
        onUser={vi.fn()}
      />,
    )

    const header = within(container).getByRole('banner')

    expect(header).toHaveStyle({
      height: 'calc(52px + var(--safe-area-inset-top))',
      paddingTop: 'var(--safe-area-inset-top)',
      paddingLeft: 'calc(1rem + var(--safe-area-inset-left))',
      paddingRight: 'calc(1rem + var(--safe-area-inset-right))',
    })
  })

  it('shows the logo and wordmark at the start of a root page', () => {
    const { container } = render(<MiniHeader onSettings={vi.fn()} onUser={vi.fn()} />)

    expect(within(container).getByRole('img', { name: 'Logo Loodi' })).toHaveAttribute('src', '/logo.svg')
    expect(within(container).getByRole('img', { name: 'Loodi' })).toHaveAttribute('src', '/loodi-wordmark.svg')
    expect(within(container).queryByRole('button', { name: 'Retour' })).not.toBeInTheDocument()
  })

  it('replaces the logo with a back button while preserving the wordmark', () => {
    const onBack = vi.fn()
    const { container } = render(<MiniHeader onSettings={vi.fn()} onUser={vi.fn()} showBack onBack={onBack} />)

    expect(within(container).getByRole('button', { name: 'Retour' })).toBeInTheDocument()
    expect(within(container).queryByRole('img', { name: 'Logo Loodi' })).not.toBeInTheDocument()
    expect(within(container).getByRole('img', { name: 'Loodi' })).toHaveAttribute('src', '/loodi-wordmark.svg')
  })

  it('presents the active module as a raised pion-yellow tile', () => {
    const { container } = render(<MiniHeader onSettings={vi.fn()} onUser={vi.fn()} appName="collec" />)

    expect(within(container).getByText('collec')).toHaveClass('loodi-mini-header__app-name')
    expect(within(container).getByText('collec')).toHaveClass('loodi-mini-header__app-tile')
    expect(within(container).getByText('collec')).toHaveClass('loodi-mini-header__app-tile--compact')
    expect(within(container).getByText('collec')).toHaveClass('loodi-mini-header__app-tile--tilted')
  })

  it('renders contextual menu actions with their Lucide icons', () => {
    const { container } = render(
      <MiniHeader
        onSettings={vi.fn()}
        onUser={vi.fn()}
        menuItems={[
          { id: 'new-game', label: 'Nouveau jeu' },
          { id: 'new-loan', label: 'Nouveau prêt' },
          { id: 'edit-game', label: 'Modifier le jeu' },
          { id: 'delete-game', label: 'Supprimer le jeu', tone: 'danger' },
          { id: 'settings', label: 'Paramètres' },
        ]}
      />,
    )

    fireEvent.click(within(container).getByRole('button', { name: 'Plus' }))

    expect(screen.getByRole('button', { name: 'Nouveau jeu' }).querySelector('.lucide-plus')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nouveau prêt' }).querySelector('.lucide-plus')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Modifier le jeu' }).querySelector('.lucide-pencil')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supprimer le jeu' }).querySelector('.lucide-trash-2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Paramètres' }).querySelector('.lucide-settings')).toBeInTheDocument()
  })

  it('hides profile and more actions when requested', () => {
    const { container } = render(<MiniHeader onSettings={vi.fn()} onUser={vi.fn()} hideActions />)

    expect(within(container).queryByRole('button', { name: 'Profil' })).not.toBeInTheDocument()
    expect(within(container).queryByRole('button', { name: 'Plus' })).not.toBeInTheDocument()
  })

  it('places the shell header behind an active module overlay', () => {
    const { container } = render(<MiniHeader onSettings={vi.fn()} onUser={vi.fn()} behindOverlay />)

    expect(within(container).getByRole('banner')).toHaveClass('loodi-mini-header--behind-overlay')
  })

  it('uses the player initial in a glass avatar for an authenticated profile', () => {
    const onUser = vi.fn()
    const { container } = render(
      <MiniHeader onSettings={vi.fn()} onUser={onUser} userInitial="B" userAvatarColor="#ca4a16" />,
    )

    const profile = within(container).getByRole('button', { name: 'Profil' })
    expect(profile).toHaveClass('loodi-mini-header__avatar-button')
    expect(profile).toHaveTextContent('B')
    expect(profile.querySelector('.lucide-user')).not.toBeInTheDocument()
    fireEvent.click(profile)
    expect(onUser).toHaveBeenCalledOnce()
  })

  it('keeps a readable monogram on a light profile colour', () => {
    const { container } = render(
      <MiniHeader onSettings={vi.fn()} onUser={vi.fn()} userInitial="B" userAvatarColor="#F5F5F0" />,
    )

    expect(within(container).getByRole('button', { name: 'Profil' })).toHaveStyle({ '--user-avatar-text': '#1A1A18' })
  })
})

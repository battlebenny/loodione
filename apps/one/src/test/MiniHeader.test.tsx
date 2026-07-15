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
})

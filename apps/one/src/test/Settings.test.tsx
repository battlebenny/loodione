import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Settings } from '../Settings'

describe('Settings', () => {
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

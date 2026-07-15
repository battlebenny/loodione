import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { BottomNav } from '@loodi/ui'

describe('BottomNav', () => {
  it('shows at most four module tabs plus the Loodi app-launcher button', () => {
    render(
      <BottomNav
        tabs={[
          { id: 'collection', icon: 'square-library', label: 'Collection' },
          { id: 'discover', icon: 'search', label: 'Découvrir' },
          { id: 'activity', icon: 'rss', label: 'Activité' },
          { id: 'profile', icon: 'user', label: 'Profil' },
          { id: 'overflow', icon: 'rss', label: 'Plus' },
        ]}
        activeTab="collection"
        onTabTap={vi.fn()}
        onAppsTap={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Applications' })).toHaveTextContent('Loodi')
    expect(screen.queryByRole('button', { name: 'Plus' })).not.toBeInTheDocument()
  })

  it('uses the same Home, Collection, Scanner and Loans icons as the standalone Loodi app', () => {
    const { container } = render(
      <BottomNav
        tabs={[
          { id: 'home', icon: 'home', label: 'Accueil' },
          { id: 'catalog', icon: 'square-library', label: 'Collection' },
          { id: 'scanner', icon: 'scan', label: 'Scanner' },
          { id: 'loans', icon: 'users', label: 'Prêts' },
        ]}
        activeTab="catalog"
        onTabTap={vi.fn()}
        onAppsTap={vi.fn()}
      />,
    )

    const home = container.querySelector('[aria-label="Accueil"]')
    const collection = container.querySelector('[aria-label="Collection"]')
    const scanner = container.querySelector('[aria-label="Scanner"]')
    const loans = container.querySelector('[aria-label="Prêts"]')

    expect(home?.querySelector('path')?.getAttribute('d')).toBe('M3 12l9-9 9 9')
    expect(collection?.querySelector('svg')).toBeInTheDocument()
    expect(scanner?.querySelectorAll('path')).toHaveLength(4)
    expect(loans?.querySelectorAll('path')).toHaveLength(3)
    expect(loans?.querySelector('circle')).toBeInTheDocument()
  })

  it('uses the Loodi brand color for the active tab', () => {
    const { container } = render(
      <BottomNav
        tabs={[{ id: 'catalog', icon: 'square-library', label: 'Collection' }]}
        activeTab="catalog"
        onTabTap={vi.fn()}
        onAppsTap={vi.fn()}
      />,
    )

    expect(container.querySelector('[aria-label="Collection"]')).toHaveClass('text-[var(--color-brand-primary)]')
  })

  it('stacks each tab label below its icon', () => {
    const css = readFileSync(resolve(process.cwd(), '../../packages/@loodi/ui/src/bottom-nav.css'), 'utf8')

    expect(css).toMatch(/\.loodi-bottom-nav__tab\s*\{[^}]*flex-direction:\s*column;/s)
  })
})

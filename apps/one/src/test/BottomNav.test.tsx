import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { BottomNav } from '@loodi/ui'

describe('BottomNav', () => {
  it('defaults to four module tabs plus the Loodi app-launcher button', () => {
    const onAppsTap = vi.fn()

    const { container } = render(
      <BottomNav
        tabs={[
          { id: 'collection', icon: 'library-big', label: 'Collection' },
          { id: 'discover', icon: 'search', label: 'Découvrir' },
          { id: 'activity', icon: 'rss', label: 'Activité' },
          { id: 'profile', icon: 'user', label: 'Profil' },
          { id: 'overflow', icon: 'rss', label: 'Plus' },
        ]}
        activeTab="collection"
        onTabTap={vi.fn()}
        onAppsTap={onAppsTap}
      />,
    )

    const nav = within(container)

    expect(nav.getAllByRole('button')).toHaveLength(5)
    expect(nav.getByRole('button', { name: 'Applications' })).toHaveTextContent('Loodi')
    expect(nav.queryByRole('button', { name: 'Plus' })).not.toBeInTheDocument()
    fireEvent.click(nav.getByRole('button', { name: 'Applications' }))
    expect(onAppsTap).toHaveBeenCalledOnce()
  })

  it('shows up to five provided tabs without the app-launcher when showApps is false', () => {
    const onTabTap = vi.fn()

    const { container } = render(
      <BottomNav
        showApps={false}
        tabs={[
          { id: 'home', icon: 'home', label: 'Accueil' },
          { id: 'collection', icon: 'library-big', label: 'Collection' },
          { id: 'scan', icon: 'scan', label: 'Scanner' },
          { id: 'settings', icon: 'settings', label: 'Paramètres' },
          { id: 'profile', icon: 'user', label: 'Profil' },
          { id: 'overflow', icon: 'rss', label: 'Plus' },
        ]}
        activeTab="home"
        onTabTap={onTabTap}
      />,
    )
    const nav = within(container)

    expect(nav.getAllByRole('button')).toHaveLength(5)
    expect(nav.queryByRole('button', { name: 'Applications' })).not.toBeInTheDocument()
    expect(nav.getByRole('button', { name: 'Paramètres' }).querySelector('svg')).toBeInTheDocument()
    expect(nav.queryByRole('button', { name: 'Plus' })).not.toBeInTheDocument()
    fireEvent.click(nav.getByRole('button', { name: 'Profil' }))
    expect(onTabTap).toHaveBeenCalledWith('profile')
  })

  it('announces positive badges and truncates their visual value at 99+', () => {
    render(
      <BottomNav
        showApps={false}
        tabs={[
          { id: 'messages', icon: 'rss', label: 'Messages', badgeCount: 100 },
          { id: 'empty', icon: 'user', label: 'Vide', badgeCount: 0 },
        ]}
        onTabTap={vi.fn()}
      />,
    )

    const messages = screen.getByRole('button', { name: 'Messages, 100 notifications' })

    expect(messages).toHaveTextContent('99+')
    expect(messages.querySelector('.loodi-bottom-nav__badge')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Vide' }).querySelector('.loodi-bottom-nav__badge')).not.toBeInTheDocument()
  })

  it('calls the optional generic swipe-up callback only for an upward gesture', () => {
    const onSwipeUp = vi.fn()
    const { container } = render(
      <BottomNav
        tabs={[{ id: 'collection', icon: 'library-big', label: 'Collection' }]}
        onTabTap={vi.fn()}
        onAppsTap={vi.fn()}
        onSwipeUp={onSwipeUp}
      />,
    )
    const surface = container.querySelector('.loodi-bottom-nav__surface')!

    fireEvent.pointerDown(surface, { clientY: 120 })
    fireEvent.pointerUp(surface, { clientY: 70 })
    fireEvent.pointerDown(surface, { clientY: 70 })
    fireEvent.pointerUp(surface, { clientY: 120 })

    expect(onSwipeUp).toHaveBeenCalledOnce()
  })

  it('uses the same Home, Collection, Scanner and Loans icons as the standalone Loodi app', () => {
    const { container } = render(
      <BottomNav
        tabs={[
          { id: 'home', icon: 'home', label: 'Accueil' },
          { id: 'catalog', icon: 'library-big', label: 'Collection' },
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
    expect(collection?.querySelector('svg')).toHaveClass('lucide-library-big')
    expect(scanner?.querySelectorAll('path')).toHaveLength(4)
    expect(loans?.querySelectorAll('path')).toHaveLength(3)
    expect(loans?.querySelector('circle')).toBeInTheDocument()
  })

  it('uses the Loodi brand color for the active tab', () => {
    const { container } = render(
      <BottomNav
        tabs={[{ id: 'catalog', icon: 'library-big', label: 'Collection' }]}
        activeTab="catalog"
        onTabTap={vi.fn()}
        onAppsTap={vi.fn()}
      />,
    )

    const css = readFileSync(resolve(process.cwd(), '../../packages/@loodi/ui/src/bottom-nav.css'), 'utf8')

    expect(container.querySelector('[aria-label="Collection"]')).toHaveClass('loodi-bottom-nav__tab--active')
    expect(css).toMatch(/\.loodi-bottom-nav__tab--active\s*\{[^}]*color:\s*var\(--color-brand-primary\);/s)
  })

  it('keeps the active indicator inset and centered inside every tab', () => {
    const { container } = render(
      <BottomNav
        tabs={[
          { id: 'home', icon: 'home', label: 'Accueil' },
          { id: 'collection', icon: 'library-big', label: 'Collection' },
          { id: 'scan', icon: 'scan', label: 'Scanner' },
          { id: 'loans', icon: 'users', label: 'Prêts' },
        ]}
        activeTab="loans"
        onTabTap={vi.fn()}
        onAppsTap={vi.fn()}
      />,
    )
    const indicator = container.querySelector('.loodi-bottom-nav__indicator')!

    expect(indicator).toHaveStyle('width: calc(100% / 5 - var(--spacing-xs) - var(--spacing-xs))')
    expect(indicator).toHaveStyle('left: calc(var(--spacing-xs) + 60%)')
  })

  it('stacks each tab label below its icon', () => {
    const css = readFileSync(resolve(process.cwd(), '../../packages/@loodi/ui/src/bottom-nav.css'), 'utf8')

    expect(css).toMatch(/\.loodi-bottom-nav__tab\s*\{[^}]*flex-direction:\s*column;/s)
    expect(css).toMatch(/\.loodi-bottom-nav__indicator\s*\{[^}]*border-radius:\s*var\(--radius-pill\);/s)
    expect(css).not.toContain('text-[')
    expect(css).toMatch(/\.loodi-bottom-nav__badge\s*\{[^}]*background:\s*var\(--color-theme-status-danger-solid\);/s)
    expect(css).toMatch(/\.loodi-bottom-nav__badge\s*\{[^}]*color:\s*var\(--color-status-on-solid\);/s)
  })
})

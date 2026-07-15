import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, EllipsisVertical, Pencil, Plus, Settings, Trash2, User, type LucideIcon } from 'lucide-react'
import type { MiniHeaderProps } from './types.js'

const HEADER_H = 52
const MENU_ICONS: Record<string, LucideIcon> = {
  'new-game': Plus,
  'new-loan': Plus,
  'edit-game': Pencil,
  'delete-game': Trash2,
  settings: Settings,
}

export function MiniHeader({ onSettings, onUser, appName, scrollProgress = 0, showBack = false, onBack, menuItems, onMenuItemSelect, hideActions = false }: MiniHeaderProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const items = menuItems ?? [{ id: 'settings', label: 'Paramètres' }]

  return (
    <header
      ref={ref}
      className="loodi-mini-header"
      style={{
        height: `calc(${HEADER_H}px + var(--safe-area-inset-top))`,
        paddingTop: 'var(--safe-area-inset-top)',
        paddingLeft: 'calc(1rem + var(--safe-area-inset-left))',
        paddingRight: 'calc(1rem + var(--safe-area-inset-right))',
      }}
    >
      <div className="loodi-mini-header__glass" style={{ opacity: scrollProgress }} />

      <div className="loodi-mini-header__left">
        <button
          onClick={onBack}
          className={`loodi-mini-header__back ${showBack ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-label="Retour"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>

        <img src="/loodi-monogram.svg" alt="Loodi" className="loodi-mini-header__logo loodi-mini-header__logo--light" />
        <img src="/loodi-monogram-dark.svg" alt="Loodi" className="loodi-mini-header__logo loodi-mini-header__logo--dark" />
        {appName && <span className="loodi-mini-header__app-name">{appName}</span>}
      </div>

      {!hideActions && (
        <div className="loodi-mini-header__actions">
          <button onClick={onUser} className="loodi-mini-header__icon-button" aria-label="Profil">
            <User size={18} aria-hidden="true" />
          </button>

          <div className="loodi-mini-header__menu-container">
            <button onClick={() => setOpen((value) => !value)} className="loodi-mini-header__icon-button" aria-label="Plus">
              <EllipsisVertical size={18} aria-hidden="true" />
            </button>

            {open && (
              <div className="loodi-mini-header__menu">
                {items.map((item) => {
                  const Icon = MENU_ICONS[item.id]

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'settings') onSettings()
                        else onMenuItemSelect?.(item.id)
                        setOpen(false)
                      }}
                      className={`loodi-mini-header__menu-item ${item.tone === 'danger' ? 'loodi-mini-header__menu-item--danger' : ''}`}
                    >
                      <span className="loodi-mini-header__menu-icon">{Icon && <Icon size={16} aria-hidden="true" />}</span>
                      {item.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

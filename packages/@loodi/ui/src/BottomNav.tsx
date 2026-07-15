import { useCallback, useRef, type ReactNode } from 'react'
import { Grid2X2, SquareLibrary, User, Users, type LucideIcon } from 'lucide-react'
import type { BottomNavProps } from './types.js'

const LUCIDE: Record<string, LucideIcon> = {
  'square-library': SquareLibrary,
  users: Users,
  user: User,
}

const LOODI_NAVIGATION_ICONS = new Set(['home', 'search', 'scan', 'rss'])

function LoodiNavigationIcon({ icon, active }: { icon: string; active: boolean }) {
  const frame = (children: ReactNode) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )

  switch (icon) {
    case 'home': return frame(<><path d="M3 12l9-9 9 9" /><path d="M5 10v9a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1v-9" /></>)
    case 'search': return frame(<><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></>)
    case 'scan': return frame(<><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /></>)
    case 'rss': return frame(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>)
    default: return null
  }
}

export function BottomNav({ tabs, activeTab, hidden, onTabTap, onAppsTap, onAppsLongPress }: BottomNavProps) {
  const moduleTabs = tabs.slice(0, 4)
  const total = moduleTabs.length + 1
  const activeIdx = moduleTabs.findIndex((tab) => tab.id === activeTab)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handlePointerDown = useCallback(() => {
    if (!onAppsLongPress) return
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = undefined
      onAppsLongPress()
    }, 400)
  }, [onAppsLongPress])
  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current !== undefined) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = undefined
    }
  }, [])

  return (
    <nav
      className={`loodi-bottom-nav ${hidden ? 'loodi-bottom-nav--hidden' : ''}`}
      style={{
        bottom: 'calc(1rem + var(--safe-area-inset-bottom))',
        left: 'calc(50% + (var(--safe-area-inset-left) - var(--safe-area-inset-right)) / 2)',
        width: 'calc(100% - 2rem - var(--safe-area-inset-left) - var(--safe-area-inset-right))',
      }}
    >
      <div className="loodi-bottom-nav__surface" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
        {moduleTabs.map((tab) => {
          const Icon = LUCIDE[tab.icon]
          const isActive = activeTab === tab.id
          const usesLoodiNavigationIcon = LOODI_NAVIGATION_ICONS.has(tab.icon)

          return (
            <button
              key={tab.id}
              onClick={() => onTabTap(tab.id)}
              className={`loodi-bottom-nav__tab ${isActive ? 'loodi-bottom-nav__tab--active text-[var(--color-brand-primary)]' : ''}`}
              aria-label={tab.label}
            >
              <span className="loodi-bottom-nav__icon">{usesLoodiNavigationIcon ? <LoodiNavigationIcon icon={tab.icon} active={isActive} /> : Icon ? <Icon size={20} strokeWidth={1.5} aria-hidden="true" /> : tab.icon}</span>
              <span className="loodi-bottom-nav__label">{tab.label}</span>
            </button>
          )
        })}

        <button
          onClick={onAppsTap}
          onPointerDown={handlePointerDown}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          className="loodi-bottom-nav__tab"
          aria-label="Applications"
        >
          <Grid2X2 size={20} strokeWidth={1.5} aria-hidden="true" />
          <span className="loodi-bottom-nav__label">Loodi</span>
        </button>

        {total > 1 && activeIdx >= 0 && (
          <div
            className="loodi-bottom-nav__indicator"
            style={{
              width: `calc(100% / ${total})`,
              transform: `translateX(${activeIdx * 100}%)`,
            }}
          />
        )}
      </div>
    </nav>
  )
}

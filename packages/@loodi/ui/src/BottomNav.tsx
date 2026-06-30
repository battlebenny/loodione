import { useMemo } from 'react'
import type { BottomNavProps } from './types'

export function BottomNav({ tabs, activeTab, onTabTap, onAppsTap }: BottomNavProps) {
  const indicator = useMemo(() => {
    const total = tabs.length + 1
    const idx = tabs.findIndex((t) => t.id === activeTab)
    return { width: `${100 / total}%`, x: `${((idx < 0 ? 0 : idx) + 1) * (100 / total)}%` }
  }, [tabs, activeTab])

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[448px] w-[calc(100%-2rem)]">
      <div className="relative flex items-center justify-around h-14 rounded-full
        bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl
        border border-black/5 dark:border-white/10
        shadow-lg shadow-black/5"
      >
        {/* Apps button (always first) */}
        <button
          onClick={onAppsTap}
          className="relative z-10 flex flex-col items-center justify-center gap-0.5
            w-14 h-10 rounded-lg transition-colors
            text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
          aria-label="Applications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>

        {/* Module tabs */}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabTap(tab.id)}
            className={`relative z-10 flex flex-col items-center justify-center gap-0.5
              w-14 h-10 rounded-lg transition-colors
              ${activeTab === tab.id
                ? 'text-black dark:text-white'
                : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'
              }`}
            aria-label={tab.label}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-[9px] leading-none font-medium">{tab.label}</span>
          </button>
        ))}

        {/* Sliding indicator */}
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-black/5 dark:bg-white/10 transition-all duration-300"
          style={{ width: indicator.width, transform: `translateX(${indicator.x})`, transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </div>
    </nav>
  )
}

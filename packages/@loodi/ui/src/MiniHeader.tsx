import { useState, useEffect, useRef } from 'react'
import type { MiniHeaderProps } from './types'

export function MiniHeader({ onSettings, onUser }: MiniHeaderProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="fixed top-0 right-0 z-50 flex items-start gap-2 p-3">
      <button
        onClick={onUser}
        className="w-9 h-9 rounded-full flex items-center justify-center text-base
          bg-white/60 dark:bg-white/10 backdrop-blur-md
          border border-black/5 dark:border-white/10
          shadow-sm hover:bg-white/80 dark:hover:bg-white/20 transition-colors"
        aria-label="Profil"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 rounded-full flex items-center justify-center
            bg-white/60 dark:bg-white/10 backdrop-blur-md
            border border-black/5 dark:border-white/10
            shadow-sm hover:bg-white/80 dark:hover:bg-white/20 transition-colors"
          aria-label="Plus"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>

        {open && (
          <div
            className="absolute right-0 top-11 min-w-44 py-1 rounded-xl
              bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
              border border-black/5 dark:border-white/10
              shadow-lg"
          >
            <button
              onClick={() => { onSettings(); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5
                text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Paramètres
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

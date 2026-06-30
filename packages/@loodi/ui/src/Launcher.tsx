import { useEffect, useRef } from 'react'
import type { LauncherProps } from './types'

export function Launcher({ apps, open, onSelect, onClose }: LauncherProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300
        ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div
        ref={ref}
        className={`relative w-full max-w-lg rounded-t-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
          border-t border-black/5 dark:border-white/10 shadow-xl
          transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-9 h-1 rounded-full bg-black/20 dark:bg-white/20" />
        </div>

        <div className="p-5">
          <h2 className="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider mb-4">
            Applications
          </h2>

          <div className="grid grid-cols-3 gap-4">
            {apps.map((app) => (
              <button
                key={app.id}
                onClick={() => onSelect(app.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                  style={{ backgroundColor: app.color + '20', boxShadow: `0 0 0 1px ${app.color}30` }}
                >
                  {app.icon}
                </div>
                <span className="text-xs font-medium text-black/70 dark:text-white/70 truncate w-full text-center">
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

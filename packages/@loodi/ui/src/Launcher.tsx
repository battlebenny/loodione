import { useRef, type CSSProperties } from 'react'
import type { LauncherProps } from './types.js'

export function Launcher({ apps, open, onSelect, onClose }: LauncherProps) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <>
      <div className={`loodi-launcher__backdrop ${open ? 'loodi-launcher__backdrop--open' : ''}`} onClick={onClose} />

      <div
        ref={ref}
        className={`loodi-launcher ${open ? 'loodi-launcher--open' : ''}`}
        style={{
          bottom: 'calc(1rem + var(--safe-area-inset-bottom))',
          left: 'calc(50% + (var(--safe-area-inset-left) - var(--safe-area-inset-right)) / 2)',
          width: 'calc(100% - 2rem - var(--safe-area-inset-left) - var(--safe-area-inset-right))',
        }}
      >
        <div className="loodi-launcher__content">
          <div className="loodi-launcher__grid">
            {apps.map((app, index) => (
              <button
                key={app.id}
                onClick={() => onSelect(app.id)}
                className="loodi-launcher__app"
                style={{ transitionDelay: open ? `${index * 30}ms` : '0ms' }}
              >
                <div className="loodi-launcher__app-icon" style={{ '--app-color': app.color } as CSSProperties}>
                  {app.icon.startsWith('http') || app.icon.startsWith('/')
                    ? <img src={app.icon} alt={app.name} className="loodi-launcher__app-image" />
                    : app.icon}
                </div>
                <span className="loodi-launcher__app-name">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="loodi-launcher__handle-wrap"><div className="loodi-launcher__handle" /></div>
      </div>
    </>
  )
}

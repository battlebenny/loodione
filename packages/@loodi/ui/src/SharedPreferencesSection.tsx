import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Check, ChevronRight, Globe, Monitor, Moon, Sun, X } from 'lucide-react'
import type { SharedPreferencesSectionProps, SharedPreferencesThemeMode } from './types.js'
import { useBottomSheetDrag } from './use-bottom-sheet-drag.js'

const entries: Array<{
  value: SharedPreferencesThemeMode
  label: string
  icon: typeof Monitor
}> = [
  { value: 'system', label: 'Système', icon: Monitor },
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
]

function selectedThemeLabel(themeMode: SharedPreferencesThemeMode): string {
  return entries.find((entry) => entry.value === themeMode)?.label ?? 'Système'
}

/**
 * The shared preference UI is deliberately storage-agnostic: each host gives
 * it a snapshot and persists the chosen value through its own contract.
 */
export function SharedPreferencesSection({
  themeMode,
  resolvedTheme,
  onThemeModeChange,
  onOverlayChange,
  disabled = false,
}: SharedPreferencesSectionProps) {
  const [themeSheetOpen, setThemeSheetOpen] = useState(false)
  const themeSheetOpenRef = useRef(false)
  const overlayChangeRef = useRef(onOverlayChange)
  overlayChangeRef.current = onOverlayChange

  useEffect(() => () => {
    if (themeSheetOpenRef.current) overlayChangeRef.current?.(false)
  }, [])

  const setThemeSheet = (open: boolean) => {
    themeSheetOpenRef.current = open
    setThemeSheetOpen(open)
    onOverlayChange?.(open)
  }

  const chooseTheme = (nextThemeMode: SharedPreferencesThemeMode) => {
    onThemeModeChange(nextThemeMode)
    setThemeSheet(false)
  }
  const { dragOffset, isDragging, handleProps } = useBottomSheetDrag(() => setThemeSheet(false))

  const themeDetail = themeMode === 'system'
    ? `Système (${resolvedTheme === 'dark' ? 'sombre' : 'clair'})`
    : selectedThemeLabel(themeMode)

  return (
    <section className="loodi-shared-preferences" aria-labelledby="loodi-preferences-title">
      <div className="loodi-shared-preferences__card">
        <h2 id="loodi-preferences-title" className="loodi-shared-preferences__title">Préférences</h2>
        <button
          type="button"
          className="loodi-shared-preferences__row"
          aria-label={`Thème ${themeDetail}`}
          aria-expanded={themeSheetOpen}
          disabled={disabled}
          onClick={() => setThemeSheet(true)}
        >
          <span className="loodi-shared-preferences__icon"><Monitor size={18} aria-hidden="true" /></span>
          <span className="loodi-shared-preferences__copy">
            <strong>Thème</strong>
            <small>{themeDetail}</small>
          </span>
          <ChevronRight className="loodi-shared-preferences__chevron" size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="loodi-shared-preferences__row loodi-shared-preferences__row--pending"
          aria-label="Langue Français (bientôt disponible)"
          disabled
        >
          <span className="loodi-shared-preferences__icon"><Globe size={18} aria-hidden="true" /></span>
          <span className="loodi-shared-preferences__copy">
            <strong>Langue</strong>
            <small>Français · Bientôt disponible</small>
          </span>
        </button>
      </div>

      {themeSheetOpen && (
        <div className="loodi-preferences-sheet" role="dialog" aria-modal="true" aria-labelledby="loodi-theme-sheet-title">
          <button type="button" className="loodi-preferences-sheet__backdrop" aria-label="Fermer le choix du thème" onClick={() => setThemeSheet(false)} />
          <div className={`loodi-preferences-sheet__panel${isDragging ? ' loodi-preferences-sheet__panel--dragging' : ''}`} style={{ '--sheet-drag-offset': `${dragOffset}px` } as CSSProperties}>
            <div className="loodi-preferences-sheet__handle" aria-hidden="true" {...handleProps} />
            <div className="loodi-preferences-sheet__header">
              <h2 id="loodi-theme-sheet-title">Thème</h2>
              <button type="button" aria-label="Fermer" className="loodi-preferences-sheet__close" onClick={() => setThemeSheet(false)}><X size={20} aria-hidden="true" /></button>
            </div>
            <div className="loodi-preferences-sheet__options" role="radiogroup" aria-label="Thème">
              {entries.map(({ value, label, icon: Icon }) => {
                const active = themeMode === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className="loodi-preferences-sheet__option"
                    onClick={() => chooseTheme(value)}
                  >
                    <span className="loodi-shared-preferences__icon"><Icon size={18} aria-hidden="true" /></span>
                    <span>{label}</span>
                    {active && <Check className="loodi-preferences-sheet__check" size={18} aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

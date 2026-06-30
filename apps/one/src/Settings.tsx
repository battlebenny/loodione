import type { ThemeMode } from './theme'

interface SettingsProps {
  themeMode: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
  onClose: () => void
}

const modes: { value: ThemeMode; label: string; desc: string }[] = [
  { value: 'system', label: 'Auto', desc: 'Suit les préférences de votre appareil' },
  { value: 'light', label: 'Clair', desc: 'Fond clair permanent' },
  { value: 'dark', label: 'Sombre', desc: 'Fond sombre permanent' },
]

export function Settings({ themeMode, onThemeChange, onClose }: SettingsProps) {
  return (
    <div className="fixed inset-0 z-40 bg-[#f5f5f0] dark:bg-[#161615] text-[#353533] dark:text-[#e8e7e4] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-3">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Retour"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Paramètres</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 overflow-hidden">
          <div className="px-4 py-3 text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider">
            Affichage
          </div>
          {modes.map((m, i) => (
            <button
              key={m.value}
              onClick={() => onThemeChange(m.value)}
              className={`w-full flex items-center justify-between px-4 py-3.5
                hover:bg-black/5 dark:hover:bg-white/5 transition-colors
                ${i < modes.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}
            >
              <div className="text-left">
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-xs text-black/40 dark:text-white/40 mt-0.5">{m.desc}</div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                  ${themeMode === m.value
                    ? 'border-[#ca4a16]'
                    : 'border-black/20 dark:border-white/20'
                  }`}
              >
                {themeMode === m.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ca4a16]" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

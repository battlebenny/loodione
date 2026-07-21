import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Activity, BellRing, Bug, ChevronRight, Eye, EyeOff, SlidersHorizontal, X } from 'lucide-react'
import { BottomNav, GlobalSettingsSection, MiniHeader, SharedPreferencesSection, type SharedPreferencesThemeMode, type Tab } from '@loodi/ui'
import type { BridgeMethods, SharedPreferences } from '@loodi/bridge'
import { createDummyBridge, createStandaloneDummyBridge, type DummyBridge } from './bridge'
import './dummy.css'

export type DummyMode = 'standalone' | 'embedded'
export type { DummyBridge } from './bridge'

type DummyPage = 'home' | 'settings'
type DiagnosticsMode = 'complete' | 'essential'

const THEME_KEY = 'loodi:dummy:theme'
const DIAGNOSTICS_KEY = 'loodi:dummy:diagnostics-mode'
const HOME_TABS: Tab[] = [{ id: 'home', icon: 'home', label: 'Accueil' }]
const STANDALONE_TABS: Tab[] = [
  { id: 'home', icon: 'home', label: 'Accueil' },
  { id: 'settings', icon: 'settings', label: 'Paramètres' },
]

function isEmbedded(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return false
  }
}

function loadThemeMode(): SharedPreferencesThemeMode {
  try {
    const value = window.localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
  } catch {
    return 'system'
  }
}

function resolveTheme(themeMode: SharedPreferencesThemeMode): 'light' | 'dark' {
  if (themeMode !== 'system') return themeMode
  if (typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function localPreferences(): SharedPreferences {
  const themeMode = loadThemeMode()
  return { themeMode, resolvedTheme: resolveTheme(themeMode), revision: 0 }
}

function loadDiagnosticsMode(): DiagnosticsMode {
  try {
    return window.localStorage.getItem(DIAGNOSTICS_KEY) === 'essential' ? 'essential' : 'complete'
  } catch {
    return 'complete'
  }
}

function saveDiagnosticsMode(mode: DiagnosticsMode): void {
  try { window.localStorage.setItem(DIAGNOSTICS_KEY, mode) } catch { /* noop */ }
}

function SettingsCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="dummy-settings-card">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function SettingsRow({ icon, label, secondary, onClick, last = true }: {
  icon: ReactNode
  label: string
  secondary: string
  onClick: () => void
  last?: boolean
}) {
  return (
    <button type="button" aria-label={label} className={`dummy-settings-row ${last ? 'dummy-settings-row--last' : ''}`} onClick={onClick}>
      <span className="dummy-settings-row__icon">{icon}</span>
      <span className="dummy-settings-row__copy"><strong>{label}</strong><small>{secondary}</small></span>
      <ChevronRight className="dummy-settings-row__chevron" size={18} aria-hidden="true" />
    </button>
  )
}

function PickerSheet({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  const titleId = `dummy-sheet-${title.toLowerCase().replaceAll(' ', '-')}`
  return (
    <div className="dummy-picker-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="dummy-picker-sheet__backdrop" aria-label={`Fermer ${title}`} onClick={onClose} />
      <div className="dummy-picker-sheet__panel">
        <div className="dummy-picker-sheet__handle" aria-hidden="true" />
        <div className="dummy-picker-sheet__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="dummy-picker-sheet__close" aria-label="Fermer" onClick={onClose}><X size={20} aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function displayResult(value: unknown): string {
  if (value === undefined) return 'undefined'
  try { return JSON.stringify(value, null, 2) } catch { return String(value) }
}

export function DummyApp({ mode = isEmbedded() ? 'embedded' : 'standalone', bridge }: { mode?: DummyMode; bridge?: DummyBridge }) {
  const [page, setPage] = useState<DummyPage>('home')
  const [diagnosticsMode, setDiagnosticsMode] = useState<DiagnosticsMode>(loadDiagnosticsMode)
  const [diagnosticsSheetOpen, setDiagnosticsSheetOpen] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [preferences, setPreferences] = useState<SharedPreferences>(localPreferences)
  const [preferencesLoading, setPreferencesLoading] = useState(mode === 'embedded')
  const [logs, setLogs] = useState<string[]>(['Prêt'])
  const [rpcResult, setRpcResult] = useState('Cliquez un bouton')
  const [scrollProgress, setScrollProgress] = useState(0)
  const createdBridge = useRef<DummyBridge | null>(null)
  const diagnosticsSheetOpenRef = useRef(false)
  if (!bridge && !createdBridge.current) {
    createdBridge.current = mode === 'embedded' ? createDummyBridge() : createStandaloneDummyBridge()
  }
  const shellBridge = bridge ?? createdBridge.current

  const addLog = (message: string) => setLogs((entries) => [message, ...entries].slice(0, 20))
  const handleSheetOverlayChange = useCallback((visible: boolean) => {
    if (mode === 'embedded') shellBridge?.emit('loodi:overlaychange', { visible })
  }, [mode, shellBridge])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', preferences.resolvedTheme === 'dark')
  }, [preferences.resolvedTheme])

  useEffect(() => {
    if (mode !== 'standalone' || preferences.themeMode !== 'system') return
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setPreferences((current) => ({ ...current, resolvedTheme: resolveTheme('system') }))
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [mode, preferences.themeMode])

  useEffect(() => {
    const update = () => {
      const scrollY = window.scrollY
      setScrollProgress(Math.min(scrollY / 78, 1))
      if (mode === 'embedded') shellBridge?.emit('loodi:scroll', { scrollY })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [mode, shellBridge])

  useEffect(() => {
    if (mode !== 'embedded' || !shellBridge) return

    let live = true
    shellBridge.ready()
    void shellBridge.setSettingsCapability(true)
    void shellBridge.setBottomNav(HOME_TABS)
    void shellBridge.getSharedPreferences()
      .then((snapshot) => {
        if (live) setPreferences(snapshot)
      })
      .catch(() => addLog('Préférences One indisponibles'))
      .finally(() => { if (live) setPreferencesLoading(false) })

    const unsubscribeTheme = shellBridge.on('loodi:themechange', ({ theme }) => {
      setPreferences((current) => ({ ...current, resolvedTheme: theme }))
    })
    const unsubscribePreferences = shellBridge.on('loodi:preferenceschange', setPreferences)
    const unsubscribeTab = shellBridge.on('loodi:tabtap', ({ tabId }) => {
      if (tabId === 'home') setPage('home')
    })
    const unsubscribeSettings = shellBridge.on('loodi:settingsopen', () => {
      setPage('settings')
      shellBridge.emit('loodi:settingsopenresult', { opened: true })
    })
    const unsubscribeBack = shellBridge.on('loodi:back', () => {
      if (diagnosticsSheetOpenRef.current) {
        diagnosticsSheetOpenRef.current = false
        setDiagnosticsSheetOpen(false)
        handleSheetOverlayChange(false)
        return
      }
      setPage((current) => current === 'settings' ? 'home' : current)
    })

    return () => {
      live = false
      unsubscribeTheme()
      unsubscribePreferences()
      unsubscribeTab()
      unsubscribeSettings()
      unsubscribeBack()
      // The generated client belongs to the iframe lifetime. Destroying it
      // here breaks React Strict Mode's development effect replay.
    }
  }, [handleSheetOverlayChange, mode, shellBridge])

  useEffect(() => {
    if (mode !== 'embedded' || !shellBridge) return
    void shellBridge.setHeaderOptions({ hideActions: page === 'settings', canGoBack: page === 'settings' })
  }, [mode, page, shellBridge])

  const handleThemeModeChange = (themeMode: SharedPreferencesThemeMode) => {
    if (mode === 'standalone') {
      try { window.localStorage.setItem(THEME_KEY, themeMode) } catch { /* noop */ }
      setPreferences((current) => ({ ...current, themeMode, resolvedTheme: resolveTheme(themeMode), revision: current.revision + 1 }))
      return
    }
    if (!shellBridge) return
    void shellBridge.updateSharedPreferences({ themeMode }).then(setPreferences).catch(() => addLog('Modification du thème refusée'))
  }

  const handleDiagnosticsMode = (nextMode: DiagnosticsMode) => {
    saveDiagnosticsMode(nextMode)
    setDiagnosticsMode(nextMode)
    diagnosticsSheetOpenRef.current = false
    setDiagnosticsSheetOpen(false)
    handleSheetOverlayChange(false)
  }

  const openDiagnosticsSheet = () => {
    diagnosticsSheetOpenRef.current = true
    setDiagnosticsSheetOpen(true)
    handleSheetOverlayChange(true)
  }

  const closeDiagnosticsSheet = () => {
    diagnosticsSheetOpenRef.current = false
    setDiagnosticsSheetOpen(false)
    handleSheetOverlayChange(false)
  }

  const setOverlay = (visible: boolean) => {
    setOverlayVisible(visible)
    shellBridge?.emit('loodi:overlaychange', { visible })
    addLog(`loodi:overlaychange {visible:${visible}} → shell`)
  }

  const runBridgeCall = (method: string, execute: () => Promise<unknown>) => {
    void execute()
      .then((value) => {
        setRpcResult(`${method} → ${displayResult(value)}`)
        addLog(`call ${method} → ${displayResult(value)}`)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        setRpcResult(`${method} → ✕ ${message}`)
        addLog(`call ${method} → ✕ ${message}`)
      })
  }

  const runMethod = <M extends keyof BridgeMethods>(method: M, ...args: Parameters<BridgeMethods[M]>) => {
    runBridgeCall(String(method), () => shellBridge?.call(method, ...args) ?? Promise.resolve(undefined))
  }

  const tabs = useMemo(() => mode === 'standalone' ? STANDALONE_TABS : HOME_TABS, [mode])
  const activeTab = page === 'settings' ? 'settings' : 'home'

  return (
    <div className={`dummy-app ${mode === 'embedded' ? 'dummy-app--embedded' : ''}`}>
      {mode === 'standalone' && (
        <MiniHeader
          onSettings={() => setPage('settings')}
          onUser={() => addLog('Profil Dummy indisponible')}
          appName="Dev"
          scrollProgress={scrollProgress}
          showBack={page === 'settings'}
          onBack={() => setPage('home')}
        />
      )}

      <main className="dummy-app__content">
        {page === 'home' ? (
          <>
            <div className="dummy-page-heading">
              <h1>Accueil</h1>
              <p>
                <span className="dummy-page-heading__eyebrow">Module de diagnostic</span>
                {mode === 'embedded' ? 'Connecté à Loodi One' : 'Utilisable aussi sans le shell Loodi'}
              </p>
            </div>

            <section className="dummy-card">
              <div className="dummy-card__icon"><Activity size={18} aria-hidden="true" /></div>
              <div>
                <h2>Bridge {mode === 'embedded' ? 'actif' : 'standalone'}</h2>
                <p>Navigation, thème et diagnostics du module.</p>
              </div>
            </section>

            <section className="dummy-card dummy-card--actions">
              <h2>RPC methods</h2>
              <div className="dummy-actions">
                <button type="button" onClick={() => runMethod('getUser')}>getUser</button>
                <button type="button" onClick={() => runMethod('getToken')}>getToken</button>
                <button type="button" onClick={() => runMethod('getNetworkStatus')}>getNetworkStatus</button>
                <button type="button" onClick={() => runMethod('getCollection')}>getCollection</button>
                <button type="button" onClick={() => runMethod('openApp', 'loodi')}>openApp loodi</button>
                <button type="button" onClick={() => runMethod('closeApp')}>closeApp</button>
                <button type="button" onClick={() => runMethod('showAppSwitcher')}>showAppSwitcher</button>
                <button type="button" onClick={() => runMethod('requestPermission', 'camera')}>requestPermission</button>
              </div>
              <output className="dummy-result" data-testid="rpc-result">{rpcResult}</output>
            </section>

            <section className="dummy-card dummy-card--actions">
              <h2>État</h2>
              <div className="dummy-actions">
                <button type="button" onClick={() => { shellBridge?.ready(); addLog('loodi:ready → shell') }}>loodi:ready</button>
                <button type="button" onClick={() => { shellBridge?.emit('loodi:badgecount', { count: 3 }); addLog('Badge envoyé à One') }}><BellRing size={16} aria-hidden="true" /> badgeCount</button>
                <button type="button" onClick={() => { void shellBridge?.setBottomNav(HOME_TABS); addLog('setBottomNav → shell') }}>setBottomNav</button>
              </div>
            </section>

            <section className="dummy-card dummy-card--actions">
              <h2>Overlay</h2>
              <div className="dummy-actions">
                <button type="button" onClick={() => setOverlay(true)}><Bug size={16} aria-hidden="true" /> Ouvrir l’overlay</button>
                <button type="button" onClick={() => setOverlay(false)}>Fermer l’overlay</button>
              </div>
              <p className="dummy-overlay-status">{overlayVisible ? 'Ouvert' : 'Fermé'}</p>
            </section>

            <section className="dummy-card dummy-card--actions">
              <h2>Thème</h2>
              <p>Thème : {preferences.resolvedTheme}</p>
            </section>

            {diagnosticsMode === 'complete' && (
              <section className="dummy-card dummy-log" data-testid="dummy-log">
                <h2>Log</h2>
                {logs.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}
              </section>
            )}
          </>
        ) : (
          <>
            <div className="dummy-page-heading">
              <h1>Paramètres</h1>
              <p>Préférences du module de diagnostic.</p>
            </div>

            <div className="dummy-settings-stack">
              <SettingsCard title="Diagnostics">
                <SettingsRow
                  icon={<SlidersHorizontal size={18} aria-hidden="true" />}
                  label="Mode des diagnostics"
                  secondary={diagnosticsMode === 'complete' ? 'Complet' : 'Essentiel'}
                  onClick={openDiagnosticsSheet}
                />
              </SettingsCard>

              <SharedPreferencesSection
                themeMode={preferences.themeMode}
                resolvedTheme={preferences.resolvedTheme}
                disabled={preferencesLoading}
                onThemeModeChange={handleThemeModeChange}
                onOverlayChange={handleSheetOverlayChange}
              />

              {mode === 'embedded' && shellBridge && (
                <GlobalSettingsSection onOpenShellSettings={() => { void shellBridge.showShellSettings() }} />
              )}
            </div>
          </>
        )}
      </main>

      {overlayVisible && (
        <section className="dummy-overlay" role="dialog" aria-modal="true" aria-label="Overlay de diagnostic">
          <div className="dummy-overlay__panel">
            <Bug size={20} aria-hidden="true" />
            <div><strong>Overlay de diagnostic</strong><p>La navigation Loodi est masquée pour ce test.</p></div>
            <button type="button" onClick={() => setOverlay(false)}>Fermer l’overlay</button>
          </div>
        </section>
      )}

      {diagnosticsSheetOpen && (
        <PickerSheet title="Mode des diagnostics" onClose={closeDiagnosticsSheet}>
          <div className="dummy-picker-sheet__options" role="radiogroup" aria-label="Mode des diagnostics">
            <button type="button" role="radio" aria-checked={diagnosticsMode === 'complete'} onClick={() => handleDiagnosticsMode('complete')}>
              <span className="dummy-settings-row__icon"><Eye size={18} aria-hidden="true" /></span><span>Complet</span>{diagnosticsMode === 'complete' && <span className="dummy-picker-sheet__check" aria-hidden="true">✓</span>}
            </button>
            <button type="button" role="radio" aria-checked={diagnosticsMode === 'essential'} onClick={() => handleDiagnosticsMode('essential')}>
              <span className="dummy-settings-row__icon"><EyeOff size={18} aria-hidden="true" /></span><span>Essentiel</span>{diagnosticsMode === 'essential' && <span className="dummy-picker-sheet__check" aria-hidden="true">✓</span>}
            </button>
          </div>
        </PickerSheet>
      )}

      {mode === 'standalone' && (
        <BottomNav
          tabs={tabs}
          activeTab={activeTab}
          showApps={false}
          onTabTap={(tabId) => setPage(tabId === 'settings' ? 'settings' : 'home')}
        />
      )}
    </div>
  )
}

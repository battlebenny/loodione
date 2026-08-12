import { Download, RefreshCw, WifiOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Workbox } from 'workbox-window'

export interface LoodiPwaProps {
  appName: string
  standalone?: boolean
  serviceWorkerPath?: string
  /** Register Vite's development service worker when the helper enables it. */
  development?: boolean
}

const VITE_DEVELOPMENT_SERVICE_WORKER = `${import.meta.env.BASE_URL}dev-sw.js?dev-sw`

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  return isOnline
}

function InstallPrompt({ appName }: { appName: string }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => setPromptEvent(null)
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])
  if (!promptEvent) return null
  const install = async () => {
    await promptEvent.prompt()
    if ((await promptEvent.userChoice).outcome === 'accepted') setPromptEvent(null)
  }
  return (
    <aside className="loodi-pwa-install-prompt" aria-label={`Installation de ${appName}`}>
      <div className="loodi-pwa-install-prompt__icon" aria-hidden="true"><Download size={20} /></div>
      <div className="loodi-pwa-install-prompt__copy">
        <strong>Installer {appName}</strong>
        <span>Ajoute {appName} à ton écran d’accueil</span>
      </div>
      <button type="button" className="loodi-pwa-primary-button" onClick={() => void install()}>Installer</button>
      <button type="button" className="loodi-pwa-icon-button" aria-label="Fermer" onClick={() => setPromptEvent(null)}><X size={18} aria-hidden="true" /></button>
    </aside>
  )
}

function UpdatePrompt({ appName, development, serviceWorkerPath }: { appName: string; development: boolean; serviceWorkerPath: string }) {
  const [waitingWorker, setWaitingWorker] = useState<Workbox | null>(null)
  useEffect(() => {
    if ((import.meta.env.DEV && !development) || !('serviceWorker' in navigator)) return
    let active = true
    let workbox: Workbox | undefined
    void import('workbox-window').then(({ Workbox }) => {
      if (!active) return
      workbox = new Workbox(serviceWorkerPath)
      workbox.addEventListener('waiting', () => setWaitingWorker(workbox ?? null))
      void workbox.register()
    })
    return () => { active = false }
  }, [development, serviceWorkerPath])
  if (!waitingWorker) return null
  const update = async () => {
    waitingWorker.addEventListener('controlling', () => window.location.reload())
    await waitingWorker.messageSW({ type: 'SKIP_WAITING' })
    setWaitingWorker(null)
  }
  return (
    <div className="loodi-pwa-update-sheet" role="dialog" aria-modal="true" aria-labelledby="loodi-pwa-update-title">
      <div className="loodi-pwa-update-sheet__backdrop" />
      <section className="loodi-pwa-update-sheet__panel">
        <RefreshCw className="loodi-pwa-update-sheet__icon" size={24} aria-hidden="true" />
        <h2 id="loodi-pwa-update-title">Mise à jour disponible</h2>
        <p>Une nouvelle version de {appName} est disponible.</p>
        <button type="button" className="loodi-pwa-primary-button" onClick={() => void update()}>Mettre à jour</button>
        <button type="button" className="loodi-pwa-secondary-button" onClick={() => setWaitingWorker(null)}>Plus tard</button>
      </section>
    </div>
  )
}

function OfflineBanner() {
  const isOnline = useNetworkStatus()
  if (isOnline) return null
  return <div className="loodi-pwa-offline-banner" role="status"><WifiOff size={16} aria-hidden="true" /><span>Tu es hors ligne</span></div>
}

export function LoodiPwa({ appName, standalone = true, serviceWorkerPath = '/sw.js', development = false }: LoodiPwaProps) {
  if (!standalone) return null
  const resolvedServiceWorkerPath = import.meta.env.DEV && development
    ? VITE_DEVELOPMENT_SERVICE_WORKER
    : serviceWorkerPath
  return <><OfflineBanner /><UpdatePrompt appName={appName} development={development} serviceWorkerPath={resolvedServiceWorkerPath} /><InstallPrompt appName={appName} /></>
}

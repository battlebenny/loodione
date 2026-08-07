import { type ReactNode, useEffect, useState } from 'react'
import { useAuth } from '@loodi/auth'
import { LoodiAccountPage } from '@loodi/ui'
import type { AppEntry, LocalModuleUrls } from './apps'
import { BottomSheet } from './BottomSheet'

interface SettingsProps {
  onClose: () => void
  apps: AppEntry[]
  favoriteAppId: string | null
  onFavoriteChange: (id: string | null) => void
  developmentApps?: AppEntry[]
  localModuleUrls?: LocalModuleUrls
  onLocalModuleUrlsChange?: (urls: LocalModuleUrls) => void
  accountName?: string
  accountProfileColor?: string
  initialPage?: 'settings' | 'account'
  onSignIn?: () => void
  isAuthenticated?: boolean
  onOverlayChange?: (visible: boolean) => void
  onLinkGoogleIdentity?: () => Promise<void>
  onUnlinkGoogleIdentity?: () => Promise<void>
  accountSuccessMessage?: string
  onAccountScrollProgress?: (progress: number) => void
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/20 dark:text-white/20 shrink-0">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/60 dark:text-white/60">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
    </svg>
  )
}

function ServerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/60 dark:text-white/60">
      <rect width="20" height="8" x="2" y="2" rx="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <path d="M6 6h.01M6 18h.01" />
    </svg>
  )
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 overflow-hidden">
      {children}
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 py-3 text-xs font-medium text-black/60 dark:text-white/60 uppercase tracking-wider border-b border-black/5 dark:border-white/5">
      {label}
    </div>
  )
}

function SettingsRowIcon({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10">
      {children}
    </div>
  )
}

interface RowProps {
  icon: ReactNode
  label: string
  secondary: string
  onClick?: () => void
  last?: boolean
}

function Row({ icon, label, secondary, onClick, last }: RowProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${last ? '' : 'border-b border-black/5 dark:border-white/5'}`}
    >
      <SettingsRowIcon>{icon}</SettingsRowIcon>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-black/50 dark:text-white/50 mt-0.5 truncate">{secondary}</div>
      </div>
      <ChevronRight />
    </button>
  )
}

function PickerOption({ children, active, onClick }: { children: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-black/5 dark:active:bg-white/10"
    >
      {children}
      {active && <CheckIcon />}
    </button>
  )
}

export function Settings({ onClose, apps, favoriteAppId, onFavoriteChange, developmentApps, localModuleUrls = {}, onLocalModuleUrlsChange, accountName, accountProfileColor, initialPage = 'settings', onSignIn, isAuthenticated, onOverlayChange, onLinkGoogleIdentity, onUnlinkGoogleIdentity, accountSuccessMessage, onAccountScrollProgress }: SettingsProps) {
  const auth = useAuth()
  const signedIn = isAuthenticated ?? auth.session !== null
  const [appSheetOpen, setAppSheetOpen] = useState(false)
  const [moduleSheetOpen, setModuleSheetOpen] = useState(false)
  const [localModuleUrlDrafts, setLocalModuleUrlDrafts] = useState<LocalModuleUrls>(localModuleUrls)
  const [accountOpen] = useState(initialPage === 'account')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (moduleSheetOpen) setLocalModuleUrlDrafts(localModuleUrls)
  }, [moduleSheetOpen, localModuleUrls])

  const favAppName = favoriteAppId
    ? apps.find((a) => a.id === favoriteAppId)?.name ?? favoriteAppId
    : 'Aucune'

  const configuredLocalModuleCount = Object.values(localModuleUrls).filter(Boolean).length

  const saveLocalModuleUrls = () => {
    onLocalModuleUrlsChange?.(localModuleUrlDrafts)
    setModuleSheetOpen(false)
  }

  if (accountOpen) return <div data-testid="loodi-account-scroll-container" onScroll={(event) => onAccountScrollProgress?.(Math.min(event.currentTarget.scrollTop / 52, 1))} className="fixed inset-0 z-20 overflow-y-auto bg-[var(--color-settings-bg)] px-4 pt-14 text-[var(--color-text-light)] dark:bg-[var(--color-settings-bg-dark)] dark:text-[var(--color-text-primary-dark)]" style={{ paddingTop: 'calc(3.5rem + var(--safe-area-inset-top))', paddingBottom: 'calc(6.5rem + var(--safe-area-inset-bottom))' }}><LoodiAccountPage isAuthenticated={signedIn} playerName={accountName} profileColor={accountProfileColor} email={auth.email} hasGoogleIdentity={auth.hasGoogleIdentity} onCreateAccount={onSignIn ?? (() => {})} onSignIn={onSignIn ?? (() => {})} onSignOut={auth.signOut} onDeleteAccount={auth.deleteAccount} onUpdateEmail={auth.updateEmail} onUpdateProfileColor={auth.updateProfileColor} onLinkGoogleIdentity={onLinkGoogleIdentity ?? auth.linkGoogleIdentity} onUnlinkGoogleIdentity={onUnlinkGoogleIdentity ?? auth.unlinkGoogleIdentity} onOverlayChange={onOverlayChange} successMessage={accountSuccessMessage} /></div>

  return (
    <div className="fixed inset-0 z-20 bg-[var(--color-settings-bg)] dark:bg-[var(--color-settings-bg-dark)] text-[var(--color-text-light)] dark:text-[var(--color-text-primary-dark)] flex flex-col">
      <div
        className="flex items-center gap-3 px-4 pt-14 pb-3"
        style={{
          paddingTop: 'calc(3.5rem + var(--safe-area-inset-top))',
          paddingLeft: 'calc(1rem + var(--safe-area-inset-left))',
          paddingRight: 'calc(1rem + var(--safe-area-inset-right))',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', textWrap: 'balance' }}>Paramètres généraux</h1>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pb-8"
        style={{
          paddingLeft: 'calc(1rem + var(--safe-area-inset-left))',
          paddingRight: 'calc(1rem + var(--safe-area-inset-right))',
          paddingBottom: 'calc(2rem + var(--safe-area-inset-bottom))',
        }}
      >
        <SectionCard>
          <SectionHeader label="Préférences" />
          <Row
            icon={<GridIcon />}
            label="Application préférée"
            secondary={favAppName}
            onClick={() => setAppSheetOpen(true)}
            last
          />
        </SectionCard>

        {developmentApps && (
          <div className="mt-5">
            <SectionCard>
              <SectionHeader label="Développement" />
              <Row
                icon={<ServerIcon />}
                label="Modules locaux"
                secondary={configuredLocalModuleCount ? `${configuredLocalModuleCount} URL${configuredLocalModuleCount > 1 ? 's' : ''} configurée${configuredLocalModuleCount > 1 ? 's' : ''}` : 'Configurer les URL de test'}
                onClick={() => setModuleSheetOpen(true)}
                last
              />
            </SectionCard>
          </div>
        )}
      </div>

      <BottomSheet open={appSheetOpen} onClose={() => setAppSheetOpen(false)} title="Application préférée">
        <div className="space-y-1 pb-2">
          <PickerOption
            active={favoriteAppId === null}
            onClick={() => { onFavoriteChange(null); setAppSheetOpen(false) }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/60 dark:text-white/60">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-black/80 dark:text-white/80">Aucune</p>
            </div>
          </PickerOption>
          {apps.map((app) => (
            <PickerOption
              key={app.id}
              active={favoriteAppId === app.id}
              onClick={() => { onFavoriteChange(app.id); setAppSheetOpen(false) }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10">
                {app.icon.startsWith('/')
                  ? <img src={app.icon} alt={app.name} className="h-6 w-6" />
                  : <span className="text-lg">{app.icon}</span>}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-black/80 dark:text-white/80">{app.name}</p>
              </div>
            </PickerOption>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={moduleSheetOpen} onClose={() => setModuleSheetOpen(false)} title="Modules locaux">
        <div className="space-y-4 pb-2">
          <p className="text-sm leading-5 text-black/55 dark:text-white/55">
            Saisis l’URL complète de chaque PWA. Utilise l’IP de ton Mac sur appareil physique, ou 10.0.2.2 dans l’émulateur Android.
          </p>
          {developmentApps?.map((app) => (
            <label key={app.id} className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-black/45 dark:text-white/45">{app.name}</span>
              <input
                aria-label={app.name}
                type="url"
                inputMode="url"
                placeholder="https://…"
                value={localModuleUrlDrafts[app.id] ?? ''}
                onChange={(event) => setLocalModuleUrlDrafts((urls) => ({ ...urls, [app.id]: event.target.value }))}
                className="w-full rounded-lg border border-black/10 bg-white/60 px-3 py-2.5 font-mono text-sm text-black/80 outline-none placeholder:text-black/25 focus:border-[var(--color-brand-primary)] dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:placeholder:text-white/25"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={saveLocalModuleUrls}
            className="w-full rounded-xl bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-primary-hover)]"
          >
            Enregistrer les URL
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}

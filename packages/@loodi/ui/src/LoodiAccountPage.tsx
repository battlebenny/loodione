import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronRight, LogOut, Mail, Palette, UserRound, X } from 'lucide-react'
import { defaultProfileColor, PROFILE_COLORS, profileColorText } from './profile-colors.js'
import type { LoodiAccountPageProps } from './types.js'

type Toast = { tone: 'success' | 'danger'; text: string }
type SheetName = 'email' | 'color' | 'google' | 'signout' | null

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3.2-4.3 3.2-7.3Z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z" /><path fill="#EA4335" d="M12 6.1c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 3 14.7 2 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1Z" /></svg>
}

function Row({ icon, label, detail, onClick, last = false, iconClassName, iconStyle }: { icon: ReactNode; label: string; detail: string; onClick?: () => void; last?: boolean; iconClassName?: string; iconStyle?: CSSProperties }) {
  return <button type="button" className={`loodi-account__row${last ? ' loodi-account__row--last' : ''}`} onClick={onClick} disabled={!onClick}>
    <span className={`loodi-account__icon${iconClassName ? ` ${iconClassName}` : ''}`} style={iconStyle}>{icon}</span>
    <span className="loodi-account__copy"><strong>{label}</strong><small>{detail}</small></span>
    {onClick && <ChevronRight className="loodi-account__chevron" size={18} aria-hidden="true" />}
  </button>
}

function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="loodi-account-sheet" role="dialog" aria-modal="true" aria-labelledby="loodi-account-sheet-title">
    <button type="button" className="loodi-account-sheet__backdrop" aria-label="Fermer" onClick={onClose} />
    <div className="loodi-account-sheet__panel">
      <div className="loodi-account-sheet__handle" />
      <header><h2 id="loodi-account-sheet-title">{title}</h2><button type="button" aria-label="Fermer" onClick={onClose}><X size={20} /></button></header>
      <div className="loodi-account-sheet__content">{children}</div>
    </div>
  </div>
}

export function LoodiAccountPage({ isAuthenticated, playerName, profileColor, email, hasGoogleIdentity = false, onCreateAccount, onSignIn, onSignOut, onUpdateEmail, onUpdateProfileColor, onLinkGoogleIdentity, onUnlinkGoogleIdentity, onOverlayChange, successMessage }: LoodiAccountPageProps) {
  const [sheet, setSheet] = useState<SheetName>(null)
  const [emailDraft, setEmailDraft] = useState(email ?? '')
  const [toast, setToast] = useState<Toast | null>(null)
  const overlayVisibleRef = useRef(false)
  const onOverlayChangeRef = useRef(onOverlayChange)
  onOverlayChangeRef.current = onOverlayChange

  useEffect(() => { if (toast) { const timer = window.setTimeout(() => setToast(null), toast.tone === 'danger' ? 3000 : 1500); return () => window.clearTimeout(timer) } }, [toast])
  useEffect(() => { if (successMessage) setToast({ tone: 'success', text: successMessage }) }, [successMessage])
  useEffect(() => () => { if (overlayVisibleRef.current) onOverlayChangeRef.current?.(false) }, [])
  useEffect(() => {
    const visible = sheet !== null
    if (visible === overlayVisibleRef.current) return
    overlayVisibleRef.current = visible
    onOverlayChangeRef.current?.(visible)
  }, [sheet])

  const showError = (error: unknown) => setToast({ tone: 'danger', text: error instanceof Error ? error.message : 'Une erreur est survenue. Réessaie dans un instant.' })
  const effectiveProfileColor = profileColor ?? defaultProfileColor(playerName)
  const changeColor = (color: string) => {
    setSheet(null)
    if (onUpdateProfileColor) void onUpdateProfileColor(color).then(() => setToast({ tone: 'success', text: 'Ta couleur de profil a été mise à jour.' })).catch(showError)
  }

  if (!isAuthenticated) return <main className="loodi-account"><h1 style={{ textWrap: 'balance' }}>Mon compte Loodi</h1><section className="loodi-account__card"><h2>Identité</h2><div className="loodi-account__welcome"><h3>Bienvenue à la table</h3><p>Crée ton compte pour retrouver tes jeux et ton profil partout dans Loodi.</p><button type="button" className="loodi-account__primary" onClick={onCreateAccount}>Créer mon compte</button><button type="button" className="loodi-account__secondary" onClick={onSignIn}>J’ai déjà un compte</button></div></section></main>

  return <main className="loodi-account">
    <h1 style={{ textWrap: 'balance' }}>Mon compte Loodi</h1>
    <section className="loodi-account__card"><h2>Identité</h2>
      <Row icon={<UserRound size={18} />} label="Nom de joueur" detail={playerName ? `@${playerName}` : 'Nom de joueur à compléter'} />
      {email && <Row icon={<Mail size={18} />} label="E-mail" detail={email} onClick={onUpdateEmail ? () => { setEmailDraft(email); setSheet('email') } : undefined} />}
      {onUpdateProfileColor && <Row icon={<Palette size={18} />} iconClassName="loodi-account__icon--profile-color" iconStyle={{ backgroundColor: effectiveProfileColor, color: profileColorText(effectiveProfileColor) }} label="Couleur de profil" detail="Personnaliser ton identité" onClick={() => setSheet('color')} />}
      <Row icon={<GoogleIcon />} label="Google" detail={hasGoogleIdentity ? 'Compte associé' : 'Associer un compte Google'} onClick={hasGoogleIdentity ? onUnlinkGoogleIdentity ? () => setSheet('google') : undefined : onLinkGoogleIdentity ? () => setSheet('google') : undefined} last />
    </section>
    {onSignOut && <section className="loodi-account__card loodi-account__connection" style={{ marginTop: 'var(--spacing-xl, 20px)' }}><h2>Connexion</h2><Row icon={<LogOut size={18} />} label="Se déconnecter" detail="Quitter cette session" onClick={() => setSheet('signout')} last /></section>}
    {toast && <p className={`loodi-account__toast loodi-account__toast--${toast.tone}`} role="status">{toast.tone === 'success' ? '✓ ' : '✗ '}{toast.text}</p>}
    {sheet === 'email' && <Sheet title="Modifier l’e-mail" onClose={() => setSheet(null)}><form onSubmit={(event) => { event.preventDefault(); if (onUpdateEmail) void onUpdateEmail(emailDraft).then(() => { setSheet(null); setToast({ tone: 'success', text: 'C’est envoyé. Vérifie ta boîte e-mail pour confirmer cette modification.' }) }).catch(showError) }}><p>Nous enverrons une confirmation à ta nouvelle adresse.</p><label htmlFor="loodi-account-email">Nouvel e-mail</label><input id="loodi-account-email" type="email" required value={emailDraft} onChange={(event) => setEmailDraft(event.target.value)} autoComplete="email" /><button className="loodi-account__primary" type="submit">Enregistrer</button></form></Sheet>}
    {sheet === 'color' && <Sheet title="Couleur de profil" onClose={() => setSheet(null)}><div className="loodi-account__color-grid">{PROFILE_COLORS.map((color) => <button key={color} type="button" className={`loodi-account__color-option${profileColor === color ? ' loodi-account__color-option--selected' : ''}`} style={{ backgroundColor: color }} aria-label={`Choisir la couleur ${color}`} aria-pressed={profileColor === color} onClick={() => changeColor(color)} />)}</div><p className="loodi-account__color-help">Choisis une couleur qui te ressemble.</p></Sheet>}
    {sheet === 'google' && (hasGoogleIdentity ? <Sheet title="Dissocier Google" onClose={() => setSheet(null)}><p>Tu pourras toujours te connecter avec ton e-mail. Google ne sera plus associé à ton compte Loodi.</p><button type="button" className="loodi-account__primary" onClick={() => setSheet(null)}>Garder Google</button><button type="button" className="loodi-account__secondary" onClick={() => { setSheet(null); if (onUnlinkGoogleIdentity) void onUnlinkGoogleIdentity().then(() => setToast({ tone: 'success', text: 'Ton compte Google a été dissocié.' })).catch(showError) }}>Dissocier Google</button></Sheet> : <Sheet title="Associer Google" onClose={() => setSheet(null)}><p>Tu pourras ensuite te connecter à ton compte Loodi avec Google, sans créer un nouveau profil.</p><button type="button" className="loodi-account__secondary loodi-account__google" onClick={() => { setSheet(null); if (onLinkGoogleIdentity) void onLinkGoogleIdentity().catch(showError) }}><GoogleIcon />Continuer avec Google</button></Sheet>)}
    {sheet === 'signout' && <Sheet title="Se déconnecter" onClose={() => setSheet(null)}><p>Tu veux vraiment changer de compte ? Tu pourras te reconnecter quand tu veux.</p><button type="button" className="loodi-account__primary" onClick={() => setSheet(null)}>Rester connecté</button><button type="button" className="loodi-account__secondary" onClick={() => { if (onSignOut) void onSignOut().then(() => setSheet(null)).catch(showError) }}>Se déconnecter</button></Sheet>}
  </main>
}
